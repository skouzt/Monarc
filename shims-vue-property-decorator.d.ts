declare module "vue-property-decorator" {
  import { ComponentCustomProperties } from "vue";

  export function Component(options: any): any;
  export function Prop(options?: any): any;
  export function Watch(path: string, options?: any): any;
  export function Emit(event?: string): any;

  export type Vue = ComponentCustomProperties;
}
