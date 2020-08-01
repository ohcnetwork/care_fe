/* TypeScript file generated from SlideOver.re by genType. */
/* eslint-disable import/first */


import * as React from 'react';

// tslint:disable-next-line:no-var-requires
const SlideOverBS = require('./SlideOver.bs');

// tslint:disable-next-line:interface-over-type-literal
export type Props = {
  readonly children: React.ReactNode; 
  readonly setShow: (_1:boolean) => void; 
  readonly show: boolean
};

export const make: React.ComponentType<{
  readonly children: React.ReactNode; 
  readonly setShow: (_1:boolean) => void; 
  readonly show: boolean
}> = SlideOverBS.make;
