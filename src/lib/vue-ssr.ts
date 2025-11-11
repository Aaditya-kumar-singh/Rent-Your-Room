import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";

export async function renderVueComponent(component: any, props: any = {}) {
  const app = createSSRApp(component, props);
  const html = await renderToString(app);
  return html;
}
