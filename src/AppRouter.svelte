<script>
  import { Home, Color, Typography, Components } from "./routes";
  import { Index } from './routes/components';
  import Navaid from 'navaid';
  import { onDestroy } from 'svelte';
  import { menu1 } from './menu';
  import { basePath } from './config';

	let Route, params;
	export let path = '';

  $: {
    if (Route) {
      path = window.location.pathname;
    }
  }
  
  function findComponent(obj) {
    const key = `${basePath}/components/${obj ? obj.id : ''}`;
    const item = menu1.find(x => x.to === key);
    if (item) {
      Route = item.component;
      // console.log('Route', Route);
    } else {
      Route = Index;
      console.log('Index', Route);
    }
  }

	const router = Navaid('/')
		.on(basePath + '/', () => Route = Home)
		.on(basePath + '/color', () => Route = Color)
    .on(basePath + '/typography', () => Route = Typography)
    .on(basePath + '/components', () => findComponent())
		.on(basePath + '/components/:id', obj => findComponent(obj))
		.listen();

	onDestroy(router.unlisten);
</script>

<div>
	<svelte:component this={Route} {params} />
</div>