import { EChartsReactProps } from "echarts-for-react";
import ReactEchartsCore from "echarts-for-react/lib/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
  VisualMapPiecewiseComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { memo } from "react";

echarts.use([
  BarChart,
  LineChart,
  CanvasRenderer,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
  VisualMapPiecewiseComponent,
  MarkLineComponent,
]);

interface ReactEchartsProps extends EChartsReactProps {
  echarts?: typeof echarts;
}

function ReactEcharts(props: ReactEchartsProps) {
  const enhancedProps = {
    ...props,
    echarts: props.echarts || echarts,
  };
  return <ReactEchartsCore {...enhancedProps} />;
}

export default memo(ReactEcharts);
