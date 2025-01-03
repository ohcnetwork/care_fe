import React from "react";
import ReactDOM from "react-dom";

export interface MicroPluginProps {
  name: string;
}

export interface Plugin {
  name: string;
  component: React.ComponentType<MicroPluginProps>;
  routes: Array<{
    path: string;
    component: React.ComponentType<any>;
  }>;
}

export interface PluginConfig {
  name: string;
  url: string;
  entry: string;
  routes: Array<{
    path: string;
    component: string;
  }>;
}

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  async loadPlugins(configs: PluginConfig[]) {
    for (const config of configs) {
      try {
        // Provide React and ReactDOM to the plugin
        (window as any).React = React;
        (window as any).ReactDOM = ReactDOM;

        await this.loadScript(config.url);
        const pluginModule = (window as any)[config.name];
        if (!pluginModule) {
          throw new Error(
            `Plugin ${config.name} not found after loading script`,
          );
        }
        const plugin: Plugin = {
          ...pluginModule,
          routes: config.routes.map((route) => {
            const component = pluginModule[route.component];
            if (!component) {
              throw new Error(
                `Component ${route.component} not found in plugin ${config.name}`,
              );
            }
            return {
              ...route,
              component,
            };
          }),
        };
        this.register(plugin);
      } catch (error) {
        console.error(`Failed to load plugin ${config.name}:`, error);
      }
    }
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
