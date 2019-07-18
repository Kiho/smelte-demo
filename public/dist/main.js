
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function validate_store(store, name) {
    if (!store || typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(component, store, callback) {
    const unsub = store.subscribe(callback);
    component.$$.on_destroy.push(unsub.unsubscribe
        ? () => unsub.unsubscribe()
        : unsub);
}
function create_slot(definition, ctx, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, fn) {
    return definition[1]
        ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
        : ctx.$$scope.ctx;
}
function get_slot_changes(definition, ctx, changed, fn) {
    return definition[1]
        ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
        : ctx.$$scope.changed || {};
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = cb => requestAnimationFrame(cb);

const tasks = new Set();
let running = false;
function run_tasks() {
    tasks.forEach(task => {
        if (!task[0](now())) {
            tasks.delete(task);
            task[1]();
        }
    });
    running = tasks.size > 0;
    if (running)
        raf(run_tasks);
}
function loop(fn) {
    let task;
    if (!running) {
        running = true;
        raf(run_tasks);
    }
    return {
        promise: new Promise(fulfil => {
            tasks.add(task = [fn, fulfil]);
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function detach_between(before, after) {
    while (before.nextSibling && before.nextSibling !== after) {
        before.parentNode.removeChild(before.nextSibling);
    }
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function to_number(value) {
    return value === '' ? undefined : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.data !== data)
        text.data = data;
}
function set_style(node, key, value) {
    node.style.setProperty(key, value);
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let stylesheet;
let active = 0;
let current_rules = {};
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    if (!current_rules[name]) {
        if (!stylesheet) {
            const style = element('style');
            document.head.appendChild(style);
            stylesheet = style.sheet;
        }
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    node.style.animation = (node.style.animation || '')
        .split(', ')
        .filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    )
        .join(', ');
    if (name && !--active)
        clear_rules();
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        let i = stylesheet.cssRules.length;
        while (i--)
            stylesheet.deleteRule(i);
        current_rules = {};
    });
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = current_component;
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
function create_in_transition(node, fn, params) {
    let config = fn(node, params);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
        if (css)
            animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
        tick(0, 1);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        if (task)
            task.abort();
        running = true;
        add_render_callback(() => dispatch(node, true, 'start'));
        task = loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(1, 0);
                    dispatch(node, true, 'end');
                    cleanup();
                    return running = false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(t, 1 - t);
                }
            }
            return running;
        });
    }
    let started = false;
    return {
        start() {
            if (started)
                return;
            delete_rule(node);
            if (is_function(config)) {
                config = config();
                wait().then(go);
            }
            else {
                go();
            }
        },
        invalidate() {
            started = false;
        },
        end() {
            if (running) {
                cleanup();
                running = false;
            }
        }
    };
}
function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
        if (css)
            animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, 'start'));
        loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(0, 1);
                    dispatch(node, false, 'end');
                    if (!--group.r) {
                        // this will result in `end()` being called,
                        // so we don't need to clean up here
                        run_all(group.c);
                    }
                    return false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(1 - t, t);
                }
            }
            return running;
        });
    }
    if (is_function(config)) {
        wait().then(() => {
            // @ts-ignore
            config = config();
            go();
        });
    }
    else {
        go();
    }
    return {
        end(reset) {
            if (reset && config.tick) {
                config.tick(1, 0);
            }
            if (running) {
                if (animation_name)
                    delete_rule(node, animation_name);
                running = false;
            }
        }
    };
}
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

const globals = (typeof window !== 'undefined' ? window : global);

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}

function bind(component, name, callback) {
    if (component.$$.props.indexOf(name) === -1)
        return;
    component.$$.bound[name] = callback;
    callback(component.$$.ctx[name]);
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, value) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

function cubicIn(t) {
    return t * t * t;
}
function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}
function quadIn(t) {
    return t * t;
}
function quadOut(t) {
    return -t * (t - 2.0);
}

function fade(node, { delay = 0, duration = 400 }) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        css: t => `opacity: ${t * o}`
    };
}
function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const od = target_opacity * (1 - opacity);
    return {
        delay,
        duration,
        easing,
        css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
    };
}
function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
    const style = getComputedStyle(node);
    const opacity = +style.opacity;
    const height = parseFloat(style.height);
    const padding_top = parseFloat(style.paddingTop);
    const padding_bottom = parseFloat(style.paddingBottom);
    const margin_top = parseFloat(style.marginTop);
    const margin_bottom = parseFloat(style.marginBottom);
    const border_top_width = parseFloat(style.borderTopWidth);
    const border_bottom_width = parseFloat(style.borderBottomWidth);
    return {
        delay,
        duration,
        easing,
        css: t => `overflow: hidden;` +
            `opacity: ${Math.min(t * 20, 1) * opacity};` +
            `height: ${t * height}px;` +
            `padding-top: ${t * padding_top}px;` +
            `padding-bottom: ${t * padding_bottom}px;` +
            `margin-top: ${t * margin_top}px;` +
            `margin-bottom: ${t * margin_bottom}px;` +
            `border-top-width: ${t * border_top_width}px;` +
            `border-bottom-width: ${t * border_bottom_width}px;`
    };
}
function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
    const style = getComputedStyle(node);
    const target_opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    const sd = 1 - start;
    const od = target_opacity * (1 - opacity);
    return {
        delay,
        duration,
        easing,
        css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
    };
}

/* node_modules\smelte\src\components\AppBar\AppBar.svelte generated by Svelte v3.6.7 */

const file = "node_modules\\smelte\\src\\components\\AppBar\\AppBar.svelte";

function create_fragment(ctx) {
	var header, header_class_value, current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			header = element("header");

			if (default_slot) default_slot.c();

			attr(header, "class", header_class_value = "" + ctx.c + " " + ctx.color + " " + ctx.classes);
			add_location(header, file, 6, 0, 188);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(header_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, header, anchor);

			if (default_slot) {
				default_slot.m(header, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if ((!current || changed.c || changed.color || changed.classes) && header_class_value !== (header_class_value = "" + ctx.c + " " + ctx.color + " " + ctx.classes)) {
				attr(header, "class", header_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(header);
			}

			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { color = "bg-primary-300", c = "", classes = "fixed top-0 w-screen items-center flex-wrap flex left-0 z-30 p-0 h-16 elevation-3" } = $$props;

	const writable_props = ['color', 'c', 'classes'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<AppBar> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('classes' in $$props) $$invalidate('classes', classes = $$props.classes);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return { color, c, classes, $$slots, $$scope };
}

class AppBar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["color", "c", "classes"]);
	}

	get color() {
		throw new Error("<AppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<AppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<AppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<AppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get classes() {
		throw new Error("<AppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set classes(value) {
		throw new Error("<AppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Icon\Icon.svelte generated by Svelte v3.6.7 */

const file$1 = "node_modules\\smelte\\src\\components\\Icon\\Icon.svelte";

function create_fragment$1(ctx) {
	var i, i_class_value, current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			i = element("i");

			if (default_slot) default_slot.c();

			attr(i, "aria-hidden", "true");
			attr(i, "class", i_class_value = "material-icons " + ctx.c + " transition" + " svelte-1gt6371");
			toggle_class(i, "reverse", ctx.reverse);
			toggle_class(i, "text-base", ctx.small);
			toggle_class(i, "text-xs", ctx.xs);
			add_location(i, file$1, 18, 0, 748);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(i_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, i, anchor);

			if (default_slot) {
				default_slot.m(i, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if ((!current || changed.c) && i_class_value !== (i_class_value = "material-icons " + ctx.c + " transition" + " svelte-1gt6371")) {
				attr(i, "class", i_class_value);
			}

			if ((changed.c || changed.reverse)) {
				toggle_class(i, "reverse", ctx.reverse);
			}

			if ((changed.c || changed.small)) {
				toggle_class(i, "text-base", ctx.small);
			}

			if ((changed.c || changed.xs)) {
				toggle_class(i, "text-xs", ctx.xs);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(i);
			}

			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { c = "", color = "text-gray-700", small = false, xs = false, reverse = false } = $$props;

	const writable_props = ['c', 'color', 'small', 'xs', 'reverse'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Icon> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('small' in $$props) $$invalidate('small', small = $$props.small);
		if ('xs' in $$props) $$invalidate('xs', xs = $$props.xs);
		if ('reverse' in $$props) $$invalidate('reverse', reverse = $$props.reverse);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		c,
		color,
		small,
		xs,
		reverse,
		$$slots,
		$$scope
	};
}

class Icon extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["c", "color", "small", "xs", "reverse"]);
	}

	get c() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get small() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set small(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get xs() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set xs(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get reverse() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set reverse(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Tabs\TabButton.svelte generated by Svelte v3.6.7 */

const file$2 = "node_modules\\smelte\\src\\components\\Tabs\\TabButton.svelte";

// (33:0) {:else}
function create_else_block(ctx) {
	var li, div1, t0, div0, t1, li_class_value, current, dispose;

	var if_block = (ctx.icon) && create_if_block_2(ctx);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			li = element("li");
			div1 = element("div");
			if (if_block) if_block.c();
			t0 = space();
			div0 = element("div");

			if (!default_slot) {
				t1 = text(ctx.text);
			}

			if (default_slot) default_slot.c();

			add_location(div0, file$2, 45, 6, 1130);
			attr(div1, "class", "flex flex-col items-center content-center mx-auto");
			add_location(div1, file$2, 40, 4, 951);
			attr(li, "class", li_class_value = "" + classes + " ripple-" + ctx.color + " text-white " + (ctx.isSelected ? `text-${ctx.color}` : ''));
			toggle_class(li, "uppercase", ctx.icon);
			add_location(li, file$2, 33, 2, 768);

			dispose = [
				listen(li, "click", ctx.click_handler_2),
				listen(li, "click", ctx.click_handler_1)
			];
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div0_nodes);
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			append(li, div1);
			if (if_block) if_block.m(div1, null);
			append(div1, t0);
			append(div1, div0);

			if (!default_slot) {
				append(div0, t1);
			}

			else {
				default_slot.m(div0, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.icon) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div1, t0);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if (!default_slot) {
				if (!current || changed.text) {
					set_data(t1, ctx.text);
				}
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if ((!current || changed.color || changed.isSelected) && li_class_value !== (li_class_value = "" + classes + " ripple-" + ctx.color + " text-white " + (ctx.isSelected ? `text-${ctx.color}` : ''))) {
				attr(li, "class", li_class_value);
			}

			if ((changed.classes || changed.color || changed.isSelected || changed.icon)) {
				toggle_class(li, "uppercase", ctx.icon);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			if (if_block) if_block.d();

			if (default_slot) default_slot.d(detaching);
			run_all(dispose);
		}
	};
}

// (17:0) {#if to}
function create_if_block(ctx) {
	var a, div1, t0, div0, t1, a_class_value, current, dispose;

	var if_block = (ctx.icon) && create_if_block_1(ctx);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			a = element("a");
			div1 = element("div");
			if (if_block) if_block.c();
			t0 = space();
			div0 = element("div");

			if (!default_slot) {
				t1 = text(ctx.text);
			}

			if (default_slot) default_slot.c();

			add_location(div0, file$2, 27, 6, 693);
			attr(div1, "class", "flex flex-col items-center content-center mx-auto");
			add_location(div1, file$2, 22, 4, 514);
			attr(a, "href", ctx.to);
			attr(a, "class", a_class_value = "" + classes + " ripple-" + ctx.color + " text-white " + (ctx.isSelected ? `text-${ctx.color}` : ''));
			toggle_class(a, "uppercase", ctx.icon);
			add_location(a, file$2, 17, 2, 368);
			dispose = listen(a, "click", ctx.click_handler);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div0_nodes);
		},

		m: function mount(target, anchor) {
			insert(target, a, anchor);
			append(a, div1);
			if (if_block) if_block.m(div1, null);
			append(div1, t0);
			append(div1, div0);

			if (!default_slot) {
				append(div0, t1);
			}

			else {
				default_slot.m(div0, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.icon) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div1, t0);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if (!default_slot) {
				if (!current || changed.text) {
					set_data(t1, ctx.text);
				}
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (!current || changed.to) {
				attr(a, "href", ctx.to);
			}

			if ((!current || changed.color || changed.isSelected) && a_class_value !== (a_class_value = "" + classes + " ripple-" + ctx.color + " text-white " + (ctx.isSelected ? `text-${ctx.color}` : ''))) {
				attr(a, "class", a_class_value);
			}

			if ((changed.classes || changed.color || changed.isSelected || changed.icon)) {
				toggle_class(a, "uppercase", ctx.icon);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(a);
			}

			if (if_block) if_block.d();

			if (default_slot) default_slot.d(detaching);
			dispose();
		}
	};
}

// (42:6) {#if icon}
function create_if_block_2(ctx) {
	var current;

	var icon_1 = new Icon({
		props: {
		c: "mb-1",
		color: ctx.isSelected ? `text-${ctx.color}` : '',
		$$slots: { default: [create_default_slot_1] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_1_changes = {};
			if (changed.isSelected || changed.color) icon_1_changes.color = ctx.isSelected ? `text-${ctx.color}` : '';
			if (changed.$$scope || changed.icon) icon_1_changes.$$scope = { changed, ctx };
			icon_1.$set(icon_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon_1, detaching);
		}
	};
}

// (43:8) <Icon c="mb-1" color={isSelected ? `text-${color}` : ''}>
function create_default_slot_1(ctx) {
	var t;

	return {
		c: function create() {
			t = text(ctx.icon);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.icon) {
				set_data(t, ctx.icon);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (24:6) {#if icon}
function create_if_block_1(ctx) {
	var current;

	var icon_1 = new Icon({
		props: {
		c: "mb-1",
		color: ctx.isSelected ? `text-${ctx.color}` : '',
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_1_changes = {};
			if (changed.isSelected || changed.color) icon_1_changes.color = ctx.isSelected ? `text-${ctx.color}` : '';
			if (changed.$$scope || changed.icon) icon_1_changes.$$scope = { changed, ctx };
			icon_1.$set(icon_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon_1, detaching);
		}
	};
}

// (25:8) <Icon c="mb-1" color={isSelected ? `text-${color}` : ''}>
function create_default_slot(ctx) {
	var t;

	return {
		c: function create() {
			t = text(ctx.icon);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.icon) {
				set_data(t, ctx.icon);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$2(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block,
		create_else_block
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.to) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

const classes =
    "text-center w-40 p-4 cursor-pointer flex mx-auto items-center opacity-75 text-sm h-full";

function instance$2($$self, $$props, $$invalidate) {
	let { icon = "", id = "", text = "", to = "", selected = "", color = "primary-500" } = $$props;

	const writable_props = ['icon', 'id', 'text', 'to', 'selected', 'color'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TabButton> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	function click_handler_1(event) {
		bubble($$self, event);
	}

	function click_handler_2() {
	      selected = id; $$invalidate('selected', selected);
	    }

	$$self.$set = $$props => {
		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
		if ('id' in $$props) $$invalidate('id', id = $$props.id);
		if ('text' in $$props) $$invalidate('text', text = $$props.text);
		if ('to' in $$props) $$invalidate('to', to = $$props.to);
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	let isSelected;

	$$self.$$.update = ($$dirty = { selected: 1, id: 1 }) => {
		if ($$dirty.selected || $$dirty.id) { $$invalidate('isSelected', isSelected = selected === id); }
	};

	return {
		icon,
		id,
		text,
		to,
		selected,
		color,
		isSelected,
		click_handler,
		click_handler_1,
		click_handler_2,
		$$slots,
		$$scope
	};
}

class TabButton extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["icon", "id", "text", "to", "selected", "color"]);
	}

	get icon() {
		throw new Error("<TabButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<TabButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<TabButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<TabButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get text() {
		throw new Error("<TabButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set text(value) {
		throw new Error("<TabButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get to() {
		throw new Error("<TabButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set to(value) {
		throw new Error("<TabButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selected() {
		throw new Error("<TabButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<TabButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<TabButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<TabButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Tabs\Tab.svelte generated by Svelte v3.6.7 */

// (6:0) {#if selected === id}
function create_if_block$1(ctx) {
	var current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			if (default_slot) default_slot.c();
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$3(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.selected === ctx.id) && create_if_block$1(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.selected === ctx.id) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { selected = false, id = null } = $$props;

	const writable_props = ['selected', 'id'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tab> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('id' in $$props) $$invalidate('id', id = $$props.id);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return { selected, id, $$slots, $$scope };
}

class Tab extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["selected", "id"]);
	}

	get selected() {
		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Tabs\Indicator.svelte generated by Svelte v3.6.7 */

const file$3 = "node_modules\\smelte\\src\\components\\Tabs\\Indicator.svelte";

function create_fragment$4(ctx) {
	var div, div_class_value, div_transition, current;

	return {
		c: function create() {
			div = element("div");
			attr(div, "class", div_class_value = "absolute bottom-0 left-0 transition bg-" + ctx.color);
			set_style(div, "width", "" + ctx.width + "px");
			set_style(div, "left", "" + ctx.left + "px");
			set_style(div, "height", "2px");
			toggle_class(div, "hidden", ctx.left < 0);
			add_location(div, file$3, 7, 0, 148);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.color) && div_class_value !== (div_class_value = "absolute bottom-0 left-0 transition bg-" + ctx.color)) {
				attr(div, "class", div_class_value);
			}

			if (!current || changed.width) {
				set_style(div, "width", "" + ctx.width + "px");
			}

			if (!current || changed.left) {
				set_style(div, "left", "" + ctx.left + "px");
			}

			if ((changed.color || changed.left)) {
				toggle_class(div, "hidden", ctx.left < 0);
			}
		},

		i: function intro(local) {
			if (current) return;
			add_render_callback(() => {
				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
				div_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
			div_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
				if (div_transition) div_transition.end();
			}
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { width = 0, left = 0, color = "primary-700" } = $$props;

	const writable_props = ['width', 'left', 'color'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Indicator> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('width' in $$props) $$invalidate('width', width = $$props.width);
		if ('left' in $$props) $$invalidate('left', left = $$props.left);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
	};

	return { width, left, color };
}

class Indicator extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["width", "left", "color"]);
	}

	get width() {
		throw new Error("<Indicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<Indicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get left() {
		throw new Error("<Indicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set left(value) {
		throw new Error("<Indicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Indicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Indicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\ProgressLinear\ProgressLinear.svelte generated by Svelte v3.6.7 */

const file$4 = "node_modules\\smelte\\src\\components\\ProgressLinear\\ProgressLinear.svelte";

function create_fragment$5(ctx) {
	var div2, div0, div0_class_value, div0_style_value, t, div1, div1_class_value, div2_class_value, div2_transition, current;

	return {
		c: function create() {
			div2 = element("div");
			div0 = element("div");
			t = space();
			div1 = element("div");
			attr(div0, "class", div0_class_value = "bg-" + ctx.color + "-500 h-1 absolute" + " svelte-8m92aa");
			attr(div0, "style", div0_style_value = ctx.progress ? `width: ${ctx.progress}%` : '');
			toggle_class(div0, "inc", !ctx.progress);
			toggle_class(div0, "transition", ctx.progress);
			add_location(div0, file$4, 87, 2, 2789);
			attr(div1, "class", div1_class_value = "bg-" + ctx.color + "-500 h-1 absolute dec" + " svelte-8m92aa");
			toggle_class(div1, "hidden", ctx.progress);
			add_location(div1, file$4, 92, 2, 2947);
			attr(div2, "class", div2_class_value = "top-0 left-0 w-full h-1 bg-" + ctx.color + "-100 overflow-hidden relative" + " svelte-8m92aa");
			toggle_class(div2, "fixed", ctx.app);
			toggle_class(div2, "z-50", ctx.app);
			toggle_class(div2, "hidden", ctx.app && !ctx.initialized);
			add_location(div2, file$4, 81, 0, 2592);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div2, t);
			append(div2, div1);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.color) && div0_class_value !== (div0_class_value = "bg-" + ctx.color + "-500 h-1 absolute" + " svelte-8m92aa")) {
				attr(div0, "class", div0_class_value);
			}

			if ((!current || changed.progress) && div0_style_value !== (div0_style_value = ctx.progress ? `width: ${ctx.progress}%` : '')) {
				attr(div0, "style", div0_style_value);
			}

			if ((changed.color || changed.progress)) {
				toggle_class(div0, "inc", !ctx.progress);
				toggle_class(div0, "transition", ctx.progress);
			}

			if ((!current || changed.color) && div1_class_value !== (div1_class_value = "bg-" + ctx.color + "-500 h-1 absolute dec" + " svelte-8m92aa")) {
				attr(div1, "class", div1_class_value);
			}

			if ((changed.color || changed.progress)) {
				toggle_class(div1, "hidden", ctx.progress);
			}

			if ((!current || changed.color) && div2_class_value !== (div2_class_value = "top-0 left-0 w-full h-1 bg-" + ctx.color + "-100 overflow-hidden relative" + " svelte-8m92aa")) {
				attr(div2, "class", div2_class_value);
			}

			if ((changed.color || changed.app)) {
				toggle_class(div2, "fixed", ctx.app);
				toggle_class(div2, "z-50", ctx.app);
			}

			if ((changed.color || changed.app || changed.initialized)) {
				toggle_class(div2, "hidden", ctx.app && !ctx.initialized);
			}
		},

		i: function intro(local) {
			if (current) return;
			add_render_callback(() => {
				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, true);
				div2_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, false);
			div2_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div2);
				if (div2_transition) div2_transition.end();
			}
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	

  let { app = false, progress = 0, color = "primary" } = $$props;

  let initialized = false;

  onMount(() => {
    if (!app) return;

    setTimeout(() => {
      $$invalidate('initialized', initialized = true);
    }, 200);
  });

	const writable_props = ['app', 'progress', 'color'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ProgressLinear> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('app' in $$props) $$invalidate('app', app = $$props.app);
		if ('progress' in $$props) $$invalidate('progress', progress = $$props.progress);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
	};

	return { app, progress, color, initialized };
}

class ProgressLinear extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["app", "progress", "color"]);
	}

	get app() {
		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set app(value) {
		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get progress() {
		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set progress(value) {
		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Tabs\Tabs.svelte generated by Svelte v3.6.7 */

const file$5 = "node_modules\\smelte\\src\\components\\Tabs\\Tabs.svelte";

const get_content_slot_changes = ({ selected }) => ({ selected: selected });
const get_content_slot_context = ({ selected }) => ({ selected: selected });

const get_item_slot_changes = () => ({});
const get_item_slot_context = () => ({});

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (42:6) <Tab bind:selected {...item} {color}>
function create_default_slot$1(ctx) {
	var t_value = ctx.item.text, t;

	return {
		c: function create() {
			t = text(t_value);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.items) && t_value !== (t_value = ctx.item.text)) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (40:2) {#each items as item, i}
function create_each_block(ctx) {
	var updating_selected, current;

	const item_slot_1 = ctx.$$slots.item;
	const item_slot = create_slot(item_slot_1, ctx, get_item_slot_context);

	var tab_spread_levels = [
		ctx.item,
		{ color: ctx.color }
	];

	function tab_selected_binding(value) {
		ctx.tab_selected_binding.call(null, value);
		updating_selected = true;
		add_flush_callback(() => updating_selected = false);
	}

	let tab_props = {
		$$slots: { default: [create_default_slot$1] },
		$$scope: { ctx }
	};
	for (var i_1 = 0; i_1 < tab_spread_levels.length; i_1 += 1) {
		tab_props = assign(tab_props, tab_spread_levels[i_1]);
	}
	if (ctx.selected !== void 0) {
		tab_props.selected = ctx.selected;
	}
	var tab = new TabButton({ props: tab_props, $$inline: true });

	binding_callbacks.push(() => bind(tab, 'selected', tab_selected_binding));

	return {
		c: function create() {
			if (!item_slot) {
				tab.$$.fragment.c();
			}

			if (item_slot) item_slot.c();
		},

		l: function claim(nodes) {
			if (item_slot) item_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!item_slot) {
				mount_component(tab, target, anchor);
			}

			else {
				item_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!item_slot) {
				var tab_changes = (changed.items || changed.color) ? get_spread_update(tab_spread_levels, [
					(changed.items) && ctx.item,
					(changed.color) && { color: ctx.color }
				]) : {};
				if (changed.$$scope || changed.items) tab_changes.$$scope = { changed, ctx };
				if (!updating_selected && changed.selected) {
					tab_changes.selected = ctx.selected;
				}
				tab.$set(tab_changes);
			}

			if (item_slot && item_slot.p && changed.$$scope) {
				item_slot.p(get_slot_changes(item_slot_1, ctx, changed, get_item_slot_changes), get_slot_context(item_slot_1, ctx, get_item_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(tab.$$.fragment, local);

			transition_in(item_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(tab.$$.fragment, local);
			transition_out(item_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!item_slot) {
				destroy_component(tab, detaching);
			}

			if (item_slot) item_slot.d(detaching);
		}
	};
}

// (45:2) {#if indicator}
function create_if_block_1$1(ctx) {
	var current;

	var indicator_1 = new Indicator({
		props: {
		color: ctx.color,
		width: ctx.indicatorWidth,
		left: ctx.offset
	},
		$$inline: true
	});

	return {
		c: function create() {
			indicator_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(indicator_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var indicator_1_changes = {};
			if (changed.color) indicator_1_changes.color = ctx.color;
			if (changed.indicatorWidth) indicator_1_changes.width = ctx.indicatorWidth;
			if (changed.offset) indicator_1_changes.left = ctx.offset;
			indicator_1.$set(indicator_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(indicator_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(indicator_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(indicator_1, detaching);
		}
	};
}

// (49:0) {#if loading}
function create_if_block$2(ctx) {
	var current;

	var progresslinear = new ProgressLinear({
		props: { color: ctx.color },
		$$inline: true
	});

	return {
		c: function create() {
			progresslinear.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(progresslinear, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var progresslinear_changes = {};
			if (changed.color) progresslinear_changes.color = ctx.color;
			progresslinear.$set(progresslinear_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(progresslinear.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(progresslinear.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(progresslinear, detaching);
		}
	};
}

function create_fragment$6(ctx) {
	var div, t0, div_class_value, t1, t2, current;

	var each_value = ctx.items;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	var if_block0 = (ctx.indicator) && create_if_block_1$1(ctx);

	var if_block1 = (ctx.loading) && create_if_block$2(ctx);

	const content_slot_1 = ctx.$$slots.content;
	const content_slot = create_slot(content_slot_1, ctx, get_content_slot_context);

	return {
		c: function create() {
			div = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			t2 = space();

			if (content_slot) content_slot.c();
			attr(div, "class", div_class_value = "" + ctx.c + " py-0 h-full " + (ctx.navigation ? 'hidden md:flex' : 'flex') + " items-center relative mx-auto z-20");
			add_location(div, file$5, 36, 0, 831);
		},

		l: function claim(nodes) {
			if (content_slot) content_slot.l(nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			append(div, t0);
			if (if_block0) if_block0.m(div, null);
			ctx.div_binding(div);
			insert(target, t1, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t2, anchor);

			if (content_slot) {
				content_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.items || changed.color || changed.selected || changed.$$scope) {
				each_value = ctx.items;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, t0);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}

			if (ctx.indicator) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_1$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div, null);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if ((!current || changed.c || changed.navigation) && div_class_value !== (div_class_value = "" + ctx.c + " py-0 h-full " + (ctx.navigation ? 'hidden md:flex' : 'flex') + " items-center relative mx-auto z-20")) {
				attr(div, "class", div_class_value);
			}

			if (ctx.loading) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block$2(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(t2.parentNode, t2);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}

			if (content_slot && content_slot.p && (changed.$$scope || changed.selected)) {
				content_slot.p(get_slot_changes(content_slot_1, ctx, changed, get_content_slot_changes), get_slot_context(content_slot_1, ctx, get_content_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(content_slot, local);
			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(content_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);

			if (if_block0) if_block0.d();
			ctx.div_binding(null);

			if (detaching) {
				detach(t1);
			}

			if (if_block1) if_block1.d(detaching);

			if (detaching) {
				detach(t2);
			}

			if (content_slot) content_slot.d(detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	

  let { selected = null, navigation = false, items = [], indicator = true, color = "white", c = "", loading = false } = $$props;

  let node;
  let indicatorWidth = 0;
  let offset = 0;

  function calcIndicator() {
    $$invalidate('indicatorWidth', indicatorWidth = node ? node.offsetWidth / items.length : 0);

    const left = selected
      ? items.findIndex(i => selected.includes(i.to || i.id))
      : 0;

    $$invalidate('offset', offset = left * indicatorWidth);
  }

  onMount(() => calcIndicator());

	const writable_props = ['selected', 'navigation', 'items', 'indicator', 'color', 'c', 'loading'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tabs> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function tab_selected_binding(value) {
		selected = value;
		$$invalidate('selected', selected);
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('node', node = $$value);
		});
	}

	$$self.$set = $$props => {
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('navigation' in $$props) $$invalidate('navigation', navigation = $$props.navigation);
		if ('items' in $$props) $$invalidate('items', items = $$props.items);
		if ('indicator' in $$props) $$invalidate('indicator', indicator = $$props.indicator);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('loading' in $$props) $$invalidate('loading', loading = $$props.loading);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	$$self.$$.update = ($$dirty = { selected: 1 }) => {
		if ($$dirty.selected) { calcIndicator(); }
	};

	return {
		selected,
		navigation,
		items,
		indicator,
		color,
		c,
		loading,
		node,
		indicatorWidth,
		offset,
		tab_selected_binding,
		div_binding,
		$$slots,
		$$scope
	};
}

class Tabs extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["selected", "navigation", "items", "indicator", "color", "c", "loading"]);
	}

	get selected() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get navigation() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set navigation(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get items() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get indicator() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set indicator(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get loading() {
		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set loading(value) {
		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function utils(color, defaultDepth = 500) {
  return {
    bg: depth => `bg-${color}-${depth || defaultDepth} `,
    border: depth => `border-${color}-${depth || defaultDepth} `,
    txt: depth => `text-${color}-${depth || defaultDepth} `,
    ripple: depth => `ripple-${color}-${depth || defaultDepth} `,
    caret: depth => `caret-${color}-${depth || defaultDepth} `
  };
}

class ClassBuilder {
  constructor() {
    this.classes = "";
  }

  flush() {
    this.classes = "";

    return this;
  }

  get() {
    return this.classes;
  }

  replace(classes, cond = true) {
    if (cond && classes) {
      this.classes = Object.keys(classes).reduce(
        (acc, from) => acc.replace(new RegExp(from, "g"), classes[from]),
        this.classes
      );
    }

    return this;
  }

  remove(classes, cond = true) {
    if (cond && classes) {
      this.classes = classes
        .split(" ")
        .reduce(
          (acc, cur) => acc.replace(new RegExp(cur, "g"), ""),
          this.classes
        );
    }

    return this;
  }

  add(className, cond = true) {
    if (cond && className) {
      this.classes += ` ${className} `;
    }

    return this;
  }
}

/* node_modules\smelte\src\components\Button\Button.svelte generated by Svelte v3.6.7 */

const file$6 = "node_modules\\smelte\\src\\components\\Button\\Button.svelte";

// (102:2) {#if icon}
function create_if_block$3(ctx) {
	var current;

	var icon_1 = new Icon({
		props: {
		c: ctx.light ? ctx.txt() : 'white',
		small: ctx.small,
		$$slots: { default: [create_default_slot$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_1_changes = {};
			if (changed.light || changed.txt) icon_1_changes.c = ctx.light ? ctx.txt() : 'white';
			if (changed.small) icon_1_changes.small = ctx.small;
			if (changed.$$scope || changed.icon) icon_1_changes.$$scope = { changed, ctx };
			icon_1.$set(icon_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon_1, detaching);
		}
	};
}

// (103:4) <Icon c={light ? txt() : 'white'} {small}>
function create_default_slot$2(ctx) {
	var t;

	return {
		c: function create() {
			t = text(ctx.icon);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.icon) {
				set_data(t, ctx.icon);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$7(ctx) {
	var button, t, button_class_value, current, dispose;

	var if_block = (ctx.icon) && create_if_block$3(ctx);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			button = element("button");
			if (if_block) if_block.c();
			t = space();

			if (default_slot) default_slot.c();

			attr(button, "class", button_class_value = "" + ctx.classes + " button");
			button.disabled = ctx.disabled;
			toggle_class(button, "border-solid", ctx.outlined);
			toggle_class(button, "rounded-full", ctx.icon);
			toggle_class(button, "w-full", ctx.block);
			toggle_class(button, "rounded", ctx.basic || ctx.outlined || ctx.text);
			toggle_class(button, "button", !ctx.icon);
			add_location(button, file$6, 91, 0, 2777);

			dispose = [
				listen(button, "click", ctx.click_handler),
				listen(button, "click", ctx.click_handler_1)
			];
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(button_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, button, anchor);
			if (if_block) if_block.m(button, null);
			append(button, t);

			if (default_slot) {
				default_slot.m(button, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.icon) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(button, t);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if ((!current || changed.classes) && button_class_value !== (button_class_value = "" + ctx.classes + " button")) {
				attr(button, "class", button_class_value);
			}

			if (!current || changed.disabled) {
				button.disabled = ctx.disabled;
			}

			if ((changed.classes || changed.outlined)) {
				toggle_class(button, "border-solid", ctx.outlined);
			}

			if ((changed.classes || changed.icon)) {
				toggle_class(button, "rounded-full", ctx.icon);
			}

			if ((changed.classes || changed.block)) {
				toggle_class(button, "w-full", ctx.block);
			}

			if ((changed.classes || changed.basic || changed.outlined || changed.text)) {
				toggle_class(button, "rounded", ctx.basic || ctx.outlined || ctx.text);
			}

			if ((changed.classes || changed.icon)) {
				toggle_class(button, "button", !ctx.icon);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(button);
			}

			if (if_block) if_block.d();

			if (default_slot) default_slot.d(detaching);
			run_all(dispose);
		}
	};
}

let commonDefault = 'py-2 px-4 uppercase text-sm font-medium';

let basicDefault = 'text-white transition ripple-white';

let outlinedDefault = 'bg-transparent border border-solid';

let textDefault = 'bg-transparent border-none px-3 hover:bg-transparent';

let iconDefault = 'p-4 m-4 flex items-center';

let fabDefault = 'px-4 hover:bg-transparent';

let smallDefault = 'p-1 h-4 w-4';

let disabledDefault = 'bg-gray-300 text-gray-500 elevation-none pointer-events-none hover:bg-gray-300 cursor-default';

let elevationDefault = 'hover:elevation-5 elevation-3';

function instance$7($$self, $$props, $$invalidate) {
	

  let { c = "", value = false, outlined = false, text = false, block = false, disabled = false, icon = null, small = false, light = false, dark = false, flat = false, color = "primary", remove = "", add = "", replace = {} } = $$props;

  const identity = i => i;

  let { commonClasses = identity, basicClasses = identity, outlinedClasses = identity, textClasses = identity, iconClasses = identity, fabClasses = identity, smallClasses = identity, disabledClasses = identity, elevationClasses = identity } = $$props;

  const fab = text && icon;
  const basic = !outlined && !text && !fab;
  const elevation = (basic || icon) && !disabled && !flat && !text;
  
  let classes = "";
  let shade = 0;
  // normal - 500, 300, 900
  // lighter - 400, 100, 800

  const {
    bg,
    border,
    txt,
    ripple,
  } = utils(color);

  const cb = new ClassBuilder();

	const writable_props = ['c', 'value', 'outlined', 'text', 'block', 'disabled', 'icon', 'small', 'light', 'dark', 'flat', 'color', 'remove', 'add', 'replace', 'commonClasses', 'basicClasses', 'outlinedClasses', 'textClasses', 'iconClasses', 'fabClasses', 'smallClasses', 'disabledClasses', 'elevationClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	function click_handler_1() {
		const $$result = (value = !value);
		$$invalidate('value', value);
		return $$result;
	}

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('outlined' in $$props) $$invalidate('outlined', outlined = $$props.outlined);
		if ('text' in $$props) $$invalidate('text', text = $$props.text);
		if ('block' in $$props) $$invalidate('block', block = $$props.block);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
		if ('small' in $$props) $$invalidate('small', small = $$props.small);
		if ('light' in $$props) $$invalidate('light', light = $$props.light);
		if ('dark' in $$props) $$invalidate('dark', dark = $$props.dark);
		if ('flat' in $$props) $$invalidate('flat', flat = $$props.flat);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('remove' in $$props) $$invalidate('remove', remove = $$props.remove);
		if ('add' in $$props) $$invalidate('add', add = $$props.add);
		if ('replace' in $$props) $$invalidate('replace', replace = $$props.replace);
		if ('commonClasses' in $$props) $$invalidate('commonClasses', commonClasses = $$props.commonClasses);
		if ('basicClasses' in $$props) $$invalidate('basicClasses', basicClasses = $$props.basicClasses);
		if ('outlinedClasses' in $$props) $$invalidate('outlinedClasses', outlinedClasses = $$props.outlinedClasses);
		if ('textClasses' in $$props) $$invalidate('textClasses', textClasses = $$props.textClasses);
		if ('iconClasses' in $$props) $$invalidate('iconClasses', iconClasses = $$props.iconClasses);
		if ('fabClasses' in $$props) $$invalidate('fabClasses', fabClasses = $$props.fabClasses);
		if ('smallClasses' in $$props) $$invalidate('smallClasses', smallClasses = $$props.smallClasses);
		if ('disabledClasses' in $$props) $$invalidate('disabledClasses', disabledClasses = $$props.disabledClasses);
		if ('elevationClasses' in $$props) $$invalidate('elevationClasses', elevationClasses = $$props.elevationClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	let normal, lighter;

	$$self.$$.update = ($$dirty = { light: 1, dark: 1, shade: 1, commonClasses: 1, commonDefault: 1, normal: 1, lighter: 1, basicClasses: 1, basicDefault: 1, elevationClasses: 1, elevationDefault: 1, outlinedClasses: 1, outlinedDefault: 1, outlined: 1, textClasses: 1, textDefault: 1, text: 1, iconClasses: 1, iconDefault: 1, icon: 1, fabClasses: 1, fabDefault: 1, disabledClasses: 1, disabledDefault: 1, disabled: 1, smallClasses: 1, smallDefault: 1, small: 1, remove: 1, replace: 1, add: 1 }) => {
		if ($$dirty.light || $$dirty.dark || $$dirty.shade) { {
        $$invalidate('shade', shade = light ? 200 : 0);
        $$invalidate('shade', shade = dark ? -400 : shade);
      } }
		if ($$dirty.shade) { $$invalidate('normal', normal = 500 - shade); }
		if ($$dirty.shade) { $$invalidate('lighter', lighter = 400 - shade); }
		if ($$dirty.commonClasses || $$dirty.commonDefault || $$dirty.normal || $$dirty.lighter || $$dirty.basicClasses || $$dirty.basicDefault || $$dirty.elevationClasses || $$dirty.elevationDefault || $$dirty.outlinedClasses || $$dirty.outlinedDefault || $$dirty.outlined || $$dirty.textClasses || $$dirty.textDefault || $$dirty.text || $$dirty.iconClasses || $$dirty.iconDefault || $$dirty.icon || $$dirty.fabClasses || $$dirty.fabDefault || $$dirty.disabledClasses || $$dirty.disabledDefault || $$dirty.disabled || $$dirty.smallClasses || $$dirty.smallDefault || $$dirty.small || $$dirty.remove || $$dirty.replace || $$dirty.add) { {
          $$invalidate('classes', classes = cb
            .flush()
            .add(commonClasses(commonDefault))
            .add(`${bg(normal)} hover:${bg(lighter)} ${basicClasses(basicDefault)}`, basic)
            .add(elevationClasses(elevationDefault), elevation)
            .add(
              `${border(lighter)} ${txt(normal)} ${ripple()} hover:${bg(50)} ${outlinedClasses(outlinedDefault)}`,
              outlined)
            .add(`${ripple()} ${txt(lighter)} ${textClasses(textDefault)}`, text)
            .add(iconClasses(iconDefault), icon)
            .remove('py-2', icon)
            .add(`${ripple()} ${fabClasses(fabDefault)}`, fab)
            .remove(`${txt(lighter)}`, fab)
            .add(disabledClasses(disabledDefault), disabled)
            .add(smallClasses(smallDefault), small)
            .remove(remove)
            .replace(replace)
            .add(add)
            .get());
      } }
	};

	return {
		c,
		value,
		outlined,
		text,
		block,
		disabled,
		icon,
		small,
		light,
		dark,
		flat,
		color,
		remove,
		add,
		replace,
		commonClasses,
		basicClasses,
		outlinedClasses,
		textClasses,
		iconClasses,
		fabClasses,
		smallClasses,
		disabledClasses,
		elevationClasses,
		basic,
		classes,
		txt,
		click_handler,
		click_handler_1,
		$$slots,
		$$scope
	};
}

class Button extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["c", "value", "outlined", "text", "block", "disabled", "icon", "small", "light", "dark", "flat", "color", "remove", "add", "replace", "commonClasses", "basicClasses", "outlinedClasses", "textClasses", "iconClasses", "fabClasses", "smallClasses", "disabledClasses", "elevationClasses"]);
	}

	get c() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlined() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlined(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get text() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set text(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get block() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set block(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get icon() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get small() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set small(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get light() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set light(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dark() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dark(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get flat() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set flat(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get remove() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set remove(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get add() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set add(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get replace() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set replace(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get commonClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set commonClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get basicClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set basicClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlinedClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlinedClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get textClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set textClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get iconClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set iconClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get fabClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set fabClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get smallClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set smallClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabledClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabledClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get elevationClasses() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set elevationClasses(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Util\Scrim.svelte generated by Svelte v3.6.7 */

const file$7 = "node_modules\\smelte\\src\\components\\Util\\Scrim.svelte";

function create_fragment$8(ctx) {
	var div, div_intro, div_outro, current, dispose;

	return {
		c: function create() {
			div = element("div");
			attr(div, "class", "opacity-50 bg-black fixed top-0 left-0 z-10 w-full h-full");
			add_location(div, file$7, 8, 0, 224);
			dispose = listen(div, "click", ctx.click_handler);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fade, ctx.inProps);
				div_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fade, ctx.outProps);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
				if (div_outro) div_outro.end();
			}

			dispose();
		}
	};
}

function instance$8($$self) {
	

  const inProps = { duration: 200, easing: quadIn };
  const outProps = { duration: 200, easing: quadOut };

	function click_handler(event) {
		bubble($$self, event);
	}

	return { inProps, outProps, click_handler };
}

class Scrim extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$8, safe_not_equal, []);
	}
}

/* node_modules\smelte\src\components\Util\Ripple.svelte generated by Svelte v3.6.7 */

const file$8 = "node_modules\\smelte\\src\\components\\Util\\Ripple.svelte";

function create_fragment$9(ctx) {
	var span, span_class_value, current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			span = element("span");

			if (default_slot) default_slot.c();

			attr(span, "class", span_class_value = "z-40 p-2 rounded-full flex items-center justify-center top-0 left-0 ripple-" + ctx.color + " svelte-sw7s12");
			add_location(span, file$8, 10, 0, 528);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(span_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);

			if (default_slot) {
				default_slot.m(span, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if ((!current || changed.color) && span_class_value !== (span_class_value = "z-40 p-2 rounded-full flex items-center justify-center top-0 left-0 ripple-" + ctx.color + " svelte-sw7s12")) {
				attr(span, "class", span_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}

			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let { color = "primary" } = $$props;

	const writable_props = ['color'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Ripple> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return { color, $$slots, $$scope };
}

class Ripple extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["color"]);
	}

	get color() {
		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Util\Spacer.svelte generated by Svelte v3.6.7 */

const file$9 = "node_modules\\smelte\\src\\components\\Util\\Spacer.svelte";

function create_fragment$a(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "class", "flex-grow");
			add_location(div, file$9, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

class Spacer extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$a, safe_not_equal, []);
	}
}

const Scrim$1 = Scrim;
const Ripple$1 = Ripple;
const Spacer$1 = Spacer;

/* node_modules\smelte\src\components\List\ListItem.svelte generated by Svelte v3.6.7 */

const file$a = "node_modules\\smelte\\src\\components\\List\\ListItem.svelte";

// (62:2) {#if icon}
function create_if_block_1$2(ctx) {
	var current;

	var icon_1 = new Icon({
		props: {
		c: "pr-6",
		small: ctx.dense,
		color: ctx.selected && ctx.navigation ? 'text-primary-500' : '',
		$$slots: { default: [create_default_slot$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_1_changes = {};
			if (changed.dense) icon_1_changes.small = ctx.dense;
			if (changed.selected || changed.navigation) icon_1_changes.color = ctx.selected && ctx.navigation ? 'text-primary-500' : '';
			if (changed.$$scope || changed.icon) icon_1_changes.$$scope = { changed, ctx };
			icon_1.$set(icon_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon_1, detaching);
		}
	};
}

// (63:4) <Icon       c="pr-6"       small={dense}       color={selected && navigation ? 'text-primary-500' : ''}>
function create_default_slot$3(ctx) {
	var t;

	return {
		c: function create() {
			t = text(ctx.icon);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.icon) {
				set_data(t, ctx.icon);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (75:4) {#if subheading}
function create_if_block$4(ctx) {
	var div, t;

	return {
		c: function create() {
			div = element("div");
			t = text(ctx.subheading);
			attr(div, "class", "text-gray-600 p-0 text-sm");
			add_location(div, file$a, 75, 6, 2296);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},

		p: function update(changed, ctx) {
			if (changed.subheading) {
				set_data(t, ctx.subheading);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment$b(ctx) {
	var li, t0, div1, div0, t1, t2, current, dispose;

	var if_block0 = (ctx.icon) && create_if_block_1$2(ctx);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	var if_block1 = (ctx.subheading) && create_if_block$4(ctx);

	return {
		c: function create() {
			li = element("li");
			if (if_block0) if_block0.c();
			t0 = space();
			div1 = element("div");
			div0 = element("div");

			if (!default_slot) {
				t1 = text(ctx.text);
			}

			if (default_slot) default_slot.c();
			t2 = space();
			if (if_block1) if_block1.c();

			add_location(div0, file$a, 71, 4, 2226);
			attr(div1, "class", "flex flex-col p-0");
			add_location(div1, file$a, 70, 2, 2190);
			attr(li, "class", "" + ctx.basicClasses + " svelte-1esblvs");
			attr(li, "tabindex", ctx.tabindex);
			toggle_class(li, "navigation", ctx.navigation);
			toggle_class(li, "selected", ctx.selected);
			toggle_class(li, "hover:bg-gray-300", !ctx.navigation);
			toggle_class(li, "ripple-white", ctx.navigation);
			toggle_class(li, "ripple-gray", !ctx.navigation);
			toggle_class(li, "py-2", ctx.dense);
			toggle_class(li, "text-gray-600", ctx.disabled);
			add_location(li, file$a, 48, 0, 1739);

			dispose = [
				listen(li, "keypress", ctx.change),
				listen(li, "click", ctx.change),
				listen(li, "click", ctx.click_handler)
			];
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div0_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, li, anchor);
			if (if_block0) if_block0.m(li, null);
			append(li, t0);
			append(li, div1);
			append(div1, div0);

			if (!default_slot) {
				append(div0, t1);
			}

			else {
				default_slot.m(div0, null);
			}

			append(div1, t2);
			if (if_block1) if_block1.m(div1, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.icon) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_1$2(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(li, t0);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (!default_slot) {
				if (!current || changed.text) {
					set_data(t1, ctx.text);
				}
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (ctx.subheading) {
				if (if_block1) {
					if_block1.p(changed, ctx);
				} else {
					if_block1 = create_if_block$4(ctx);
					if_block1.c();
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!current || changed.basicClasses) {
				attr(li, "class", "" + ctx.basicClasses + " svelte-1esblvs");
			}

			if (!current || changed.tabindex) {
				attr(li, "tabindex", ctx.tabindex);
			}

			if ((changed.basicClasses || changed.navigation)) {
				toggle_class(li, "navigation", ctx.navigation);
			}

			if ((changed.basicClasses || changed.selected)) {
				toggle_class(li, "selected", ctx.selected);
			}

			if ((changed.basicClasses || changed.navigation)) {
				toggle_class(li, "hover:bg-gray-300", !ctx.navigation);
				toggle_class(li, "ripple-white", ctx.navigation);
				toggle_class(li, "ripple-gray", !ctx.navigation);
			}

			if ((changed.basicClasses || changed.dense)) {
				toggle_class(li, "py-2", ctx.dense);
			}

			if ((changed.basicClasses || changed.disabled)) {
				toggle_class(li, "text-gray-600", ctx.disabled);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(li);
			}

			if (if_block0) if_block0.d();

			if (default_slot) default_slot.d(detaching);
			if (if_block1) if_block1.d();
			run_all(dispose);
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	

  let { icon = "", id = "", value = "", text = "", subheading = "", disabled = false, dense = false, navigation = false, to = "", selected = false, tabindex = null, basicClasses = "transition p-4 cursor-pointer text-gray-700 flex items-center z-10" } = $$props;

  const dispatch = createEventDispatcher();

  function change() {
    if (disabled) return;
    $$invalidate('value', value = id);
    dispatch('change', id);
  }

	const writable_props = ['icon', 'id', 'value', 'text', 'subheading', 'disabled', 'dense', 'navigation', 'to', 'selected', 'tabindex', 'basicClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ListItem> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
		if ('id' in $$props) $$invalidate('id', id = $$props.id);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('text' in $$props) $$invalidate('text', text = $$props.text);
		if ('subheading' in $$props) $$invalidate('subheading', subheading = $$props.subheading);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('dense' in $$props) $$invalidate('dense', dense = $$props.dense);
		if ('navigation' in $$props) $$invalidate('navigation', navigation = $$props.navigation);
		if ('to' in $$props) $$invalidate('to', to = $$props.to);
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('tabindex' in $$props) $$invalidate('tabindex', tabindex = $$props.tabindex);
		if ('basicClasses' in $$props) $$invalidate('basicClasses', basicClasses = $$props.basicClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		icon,
		id,
		value,
		text,
		subheading,
		disabled,
		dense,
		navigation,
		to,
		selected,
		tabindex,
		basicClasses,
		change,
		click_handler,
		$$slots,
		$$scope
	};
}

class ListItem extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$a, create_fragment$b, safe_not_equal, ["icon", "id", "value", "text", "subheading", "disabled", "dense", "navigation", "to", "selected", "tabindex", "basicClasses"]);
	}

	get icon() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get text() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set text(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get subheading() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subheading(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dense() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dense(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get navigation() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set navigation(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get to() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set to(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selected() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tabindex() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tabindex(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get basicClasses() {
		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set basicClasses(value) {
		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\List\List.svelte generated by Svelte v3.6.7 */

const file$b = "node_modules\\smelte\\src\\components\\List\\List.svelte";

const get_item_slot_changes_1 = ({ item, items, dense, navigation, value }) => ({
	item: items,
	dense: dense,
	navigation: navigation,
	value: value
});
const get_item_slot_context_1 = ({ item, items, dense, navigation, value }) => ({
	item: item,
	dense: dense,
	navigation: navigation,
	value: value
});

const get_item_slot_changes$1 = ({ item, items, dense, navigation, value }) => ({
	item: items,
	dense: dense,
	navigation: navigation,
	value: value
});
const get_item_slot_context$1 = ({ item, items, dense, navigation, value }) => ({
	item: item,
	dense: dense,
	navigation: navigation,
	value: value
});

function get_each_context$1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (32:6) {:else}
function create_else_block$1(ctx) {
	var updating_value, t, current;

	const item_slot_1 = ctx.$$slots.item;
	const item_slot = create_slot(item_slot_1, ctx, get_item_slot_context_1);

	var listitem_spread_levels = [
		ctx.item,
		{ tabindex: ctx.i + 1 },
		{ id: ctx.id(ctx.item) },
		{ selected: ctx.value === ctx.id(ctx.item) },
		ctx.props
	];

	function listitem_value_binding_1(value_1) {
		ctx.listitem_value_binding_1.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let listitem_props = {
		$$slots: { default: [create_default_slot_1$1] },
		$$scope: { ctx }
	};
	for (var i = 0; i < listitem_spread_levels.length; i += 1) {
		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
	}
	if (ctx.value !== void 0) {
		listitem_props.value = ctx.value;
	}
	var listitem = new ListItem({ props: listitem_props, $$inline: true });

	binding_callbacks.push(() => bind(listitem, 'value', listitem_value_binding_1));
	listitem.$on("change", ctx.change_handler_1);

	return {
		c: function create() {
			if (!item_slot) {
				listitem.$$.fragment.c();
				t = space();
			}

			if (item_slot) item_slot.c();
		},

		l: function claim(nodes) {
			if (item_slot) item_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!item_slot) {
				mount_component(listitem, target, anchor);
				insert(target, t, anchor);
			}

			else {
				item_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!item_slot) {
				var listitem_changes = (changed.items || changed.id || changed.value || changed.props) ? get_spread_update(listitem_spread_levels, [
					(changed.items) && ctx.item,
					{ tabindex: ctx.i + 1 },
					(changed.id || changed.items) && { id: ctx.id(ctx.item) },
					(changed.value || changed.id || changed.items) && { selected: ctx.value === ctx.id(ctx.item) },
					(changed.props) && ctx.props
				]) : {};
				if (changed.$$scope || changed.items) listitem_changes.$$scope = { changed, ctx };
				if (!updating_value && changed.value) {
					listitem_changes.value = ctx.value;
				}
				listitem.$set(listitem_changes);
			}

			if (item_slot && item_slot.p && (changed.$$scope || changed.items || changed.dense || changed.navigation || changed.value)) {
				item_slot.p(get_slot_changes(item_slot_1, ctx, changed, get_item_slot_changes_1), get_slot_context(item_slot_1, ctx, get_item_slot_context_1));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(listitem.$$.fragment, local);

			transition_in(item_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(listitem.$$.fragment, local);
			transition_out(item_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!item_slot) {
				destroy_component(listitem, detaching);

				if (detaching) {
					detach(t);
				}
			}

			if (item_slot) item_slot.d(detaching);
		}
	};
}

// (24:6) {#if item.to}
function create_if_block$5(ctx) {
	var a, updating_value, a_href_value, t, current;

	const item_slot_1 = ctx.$$slots.item;
	const item_slot = create_slot(item_slot_1, ctx, get_item_slot_context$1);

	var listitem_spread_levels = [
		ctx.item,
		{ id: ctx.id(ctx.item) },
		ctx.props
	];

	function listitem_value_binding(value_1) {
		ctx.listitem_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let listitem_props = {
		$$slots: { default: [create_default_slot$4] },
		$$scope: { ctx }
	};
	for (var i = 0; i < listitem_spread_levels.length; i += 1) {
		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
	}
	if (ctx.value !== void 0) {
		listitem_props.value = ctx.value;
	}
	var listitem = new ListItem({ props: listitem_props, $$inline: true });

	binding_callbacks.push(() => bind(listitem, 'value', listitem_value_binding));
	listitem.$on("change", ctx.change_handler);

	return {
		c: function create() {
			if (!item_slot) {
				a = element("a");
				listitem.$$.fragment.c();
				t = space();
			}

			if (item_slot) item_slot.c();
			if (!item_slot) {
				attr(a, "tabindex", ctx.i + 1);
				attr(a, "href", a_href_value = ctx.item.to);
				add_location(a, file$b, 25, 10, 597);
			}
		},

		l: function claim(nodes) {
			if (item_slot) item_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!item_slot) {
				insert(target, a, anchor);
				mount_component(listitem, a, null);
				insert(target, t, anchor);
			}

			else {
				item_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!item_slot) {
				var listitem_changes = (changed.items || changed.id || changed.props) ? get_spread_update(listitem_spread_levels, [
					(changed.items) && ctx.item,
					(changed.id || changed.items) && { id: ctx.id(ctx.item) },
					(changed.props) && ctx.props
				]) : {};
				if (changed.$$scope || changed.items) listitem_changes.$$scope = { changed, ctx };
				if (!updating_value && changed.value) {
					listitem_changes.value = ctx.value;
				}
				listitem.$set(listitem_changes);

				if ((!current || changed.items) && a_href_value !== (a_href_value = ctx.item.to)) {
					attr(a, "href", a_href_value);
				}
			}

			if (item_slot && item_slot.p && (changed.$$scope || changed.items || changed.dense || changed.navigation || changed.value)) {
				item_slot.p(get_slot_changes(item_slot_1, ctx, changed, get_item_slot_changes$1), get_slot_context(item_slot_1, ctx, get_item_slot_context$1));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(listitem.$$.fragment, local);

			transition_in(item_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(listitem.$$.fragment, local);
			transition_out(item_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!item_slot) {
				if (detaching) {
					detach(a);
				}

				destroy_component(listitem, );

				if (detaching) {
					detach(t);
				}
			}

			if (item_slot) item_slot.d(detaching);
		}
	};
}

// (34:10) <ListItem             bind:value             {...item}             tabindex={i + 1}             id={id(item)}             selected={value === id(item)}             {...props}             on:change>
function create_default_slot_1$1(ctx) {
	var t_value = ctx.item.text || ctx.item.value || ctx.item, t;

	return {
		c: function create() {
			t = text(t_value);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.items) && t_value !== (t_value = ctx.item.text || ctx.item.value || ctx.item)) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (27:12) <ListItem bind:value {...item} id={id(item)} {...props} on:change>
function create_default_slot$4(ctx) {
	var t_value = ctx.item.text, t;

	return {
		c: function create() {
			t = text(t_value);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.items) && t_value !== (t_value = ctx.item.text)) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (23:4) {#each items as item, i}
function create_each_block$1(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$5,
		create_else_block$1
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.item.to) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function create_fragment$c(ctx) {
	var div, ul, current;

	var each_value = ctx.items;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c: function create() {
			div = element("div");
			ul = element("ul");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(ul, "class", "py-2 rounded");
			toggle_class(ul, "rounded-t-none", ctx.select);
			add_location(ul, file$b, 21, 2, 419);
			attr(div, "class", ctx.c);
			add_location(div, file$b, 20, 0, 401);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, ul);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.items || changed.id || changed.props || changed.value || changed.$$scope || changed.dense || changed.navigation) {
				each_value = ctx.items;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul, null);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}

			if (changed.select) {
				toggle_class(ul, "rounded-t-none", ctx.select);
			}

			if (!current || changed.c) {
				attr(div, "class", ctx.c);
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { items = [], item = {}, value = "", text = "", dense = false, navigation = false, select = false, c = "" } = $$props;

  const props = {
    dense,
    navigation
  };

  const id = item => item.id || item.value || item.to || item.text || item;

	const writable_props = ['items', 'item', 'value', 'text', 'dense', 'navigation', 'select', 'c'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<List> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function change_handler(event) {
		bubble($$self, event);
	}

	function change_handler_1(event) {
		bubble($$self, event);
	}

	function listitem_value_binding(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	function listitem_value_binding_1(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	$$self.$set = $$props => {
		if ('items' in $$props) $$invalidate('items', items = $$props.items);
		if ('item' in $$props) $$invalidate('item', item = $$props.item);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('text' in $$props) $$invalidate('text', text = $$props.text);
		if ('dense' in $$props) $$invalidate('dense', dense = $$props.dense);
		if ('navigation' in $$props) $$invalidate('navigation', navigation = $$props.navigation);
		if ('select' in $$props) $$invalidate('select', select = $$props.select);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		items,
		item,
		value,
		text,
		dense,
		navigation,
		select,
		c,
		props,
		id,
		change_handler,
		change_handler_1,
		listitem_value_binding,
		listitem_value_binding_1,
		$$slots,
		$$scope
	};
}

class List extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$c, safe_not_equal, ["items", "item", "value", "text", "dense", "navigation", "select", "c"]);
	}

	get items() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get item() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set item(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get text() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set text(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get dense() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set dense(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get navigation() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set navigation(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get select() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set select(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\NavigationDrawer\NavigationDrawer.svelte generated by Svelte v3.6.7 */

const file$c = "node_modules\\smelte\\src\\components\\NavigationDrawer\\NavigationDrawer.svelte";

// (60:0) {#if show}
function create_if_block$6(ctx) {
	var aside, t, nav, div, nav_transition, current, dispose;

	var if_block = (ctx.showWithScrim) && create_if_block_1$3(ctx);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			aside = element("aside");
			if (if_block) if_block.c();
			t = space();
			nav = element("nav");
			div = element("div");

			if (default_slot) default_slot.c();

			attr(div, "class", "w-full");
			add_location(div, file$c, 79, 6, 2585);
			attr(nav, "role", "navigation");
			attr(nav, "class", "" + ctx.navClasses + " svelte-txew9g");
			add_location(nav, file$c, 75, 4, 2485);
			attr(aside, "class", "" + ctx.asideClasses + " svelte-txew9g");
			toggle_class(aside, "right-0", ctx.right);
			toggle_class(aside, "aside", ctx.breakpoint !== "sm");
			toggle_class(aside, "h-full", ctx.breakpoint === "sm");
			toggle_class(aside, "left-0", !ctx.right);
			toggle_class(aside, "pointer-events-none", !ctx.showWithScrim);
			toggle_class(aside, "z-50", ctx.showWithScrim);
			toggle_class(aside, "elevation-4", ctx.elevation);
			toggle_class(aside, "bordered", !ctx.elevation && !ctx.showWithScrim);
			toggle_class(aside, "z-20", !ctx.showWithScrim);
			add_location(aside, file$c, 60, 2, 2017);
			dispose = listen(aside, "click", ctx.click_handler);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div_nodes);
		},

		m: function mount(target, anchor) {
			insert(target, aside, anchor);
			if (if_block) if_block.m(aside, null);
			append(aside, t);
			append(aside, nav);
			append(nav, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.showWithScrim) {
				if (!if_block) {
					if_block = create_if_block_1$3(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(aside, t);
				} else {
									transition_in(if_block, 1);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (!current || changed.navClasses) {
				attr(nav, "class", "" + ctx.navClasses + " svelte-txew9g");
			}

			if (!current || changed.asideClasses) {
				attr(aside, "class", "" + ctx.asideClasses + " svelte-txew9g");
			}

			if ((changed.asideClasses || changed.right)) {
				toggle_class(aside, "right-0", ctx.right);
			}

			if ((changed.asideClasses || changed.breakpoint)) {
				toggle_class(aside, "aside", ctx.breakpoint !== "sm");
				toggle_class(aside, "h-full", ctx.breakpoint === "sm");
			}

			if ((changed.asideClasses || changed.right)) {
				toggle_class(aside, "left-0", !ctx.right);
			}

			if ((changed.asideClasses || changed.showWithScrim)) {
				toggle_class(aside, "pointer-events-none", !ctx.showWithScrim);
				toggle_class(aside, "z-50", ctx.showWithScrim);
			}

			if ((changed.asideClasses || changed.elevation)) {
				toggle_class(aside, "elevation-4", ctx.elevation);
			}

			if ((changed.asideClasses || changed.elevation || changed.showWithScrim)) {
				toggle_class(aside, "bordered", !ctx.elevation && !ctx.showWithScrim);
			}

			if ((changed.asideClasses || changed.showWithScrim)) {
				toggle_class(aside, "z-20", !ctx.showWithScrim);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(default_slot, local);

			add_render_callback(() => {
				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, fly, ctx.transitionProps, true);
				nav_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			transition_out(default_slot, local);

			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, fly, ctx.transitionProps, false);
			nav_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(aside);
			}

			if (if_block) if_block.d();

			if (default_slot) default_slot.d(detaching);

			if (detaching) {
				if (nav_transition) nav_transition.end();
			}

			dispose();
		}
	};
}

// (73:4) {#if showWithScrim}
function create_if_block_1$3(ctx) {
	var current;

	var scrim = new Scrim$1({ $$inline: true });
	scrim.$on("click", ctx.hide);

	return {
		c: function create() {
			scrim.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(scrim, target, anchor);
			current = true;
		},

		i: function intro(local) {
			if (current) return;
			transition_in(scrim.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(scrim.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(scrim, detaching);
		}
	};
}

function create_fragment$d(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.show) && create_if_block$6(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.show) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$6(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function shouldShowWithScrim(mobile, persist, bp) {
  if (bp === "sm") {
    return mobile;
  }

  return !persist;
}

function instance$c($$self, $$props, $$invalidate) {
	

  let { right = false, persistent = false, elevation = true, showMobile = false, showDesktop = true, breakpoint = "", asideClasses = "fixed top-0 md:mt-16 w-auto drawer overflow-hidden", navClasses = `h-full bg-white absolute flex w-auto z-20 drawer
     pointer-events-auto overflow-y-auto` } = $$props;

  function hide() {
    if (breakpoint === "sm") {
      $$invalidate('showMobile', showMobile = false);
      return;
    }
    $$invalidate('showDesktop', showDesktop = false);
  }

	const writable_props = ['right', 'persistent', 'elevation', 'showMobile', 'showDesktop', 'breakpoint', 'asideClasses', 'navClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<NavigationDrawer> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler() {
		const $$result = (showMobile = false);
		$$invalidate('showMobile', showMobile);
		return $$result;
	}

	$$self.$set = $$props => {
		if ('right' in $$props) $$invalidate('right', right = $$props.right);
		if ('persistent' in $$props) $$invalidate('persistent', persistent = $$props.persistent);
		if ('elevation' in $$props) $$invalidate('elevation', elevation = $$props.elevation);
		if ('showMobile' in $$props) $$invalidate('showMobile', showMobile = $$props.showMobile);
		if ('showDesktop' in $$props) $$invalidate('showDesktop', showDesktop = $$props.showDesktop);
		if ('breakpoint' in $$props) $$invalidate('breakpoint', breakpoint = $$props.breakpoint);
		if ('asideClasses' in $$props) $$invalidate('asideClasses', asideClasses = $$props.asideClasses);
		if ('navClasses' in $$props) $$invalidate('navClasses', navClasses = $$props.navClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	let showWithScrim, show, transitionProps;

	$$self.$$.update = ($$dirty = { showMobile: 1, persistent: 1, breakpoint: 1, showDesktop: 1, showWithScrim: 1, right: 1 }) => {
		if ($$dirty.showMobile || $$dirty.persistent || $$dirty.breakpoint) { $$invalidate('showWithScrim', showWithScrim = shouldShowWithScrim(showMobile, persistent, breakpoint)); }
		if ($$dirty.breakpoint || $$dirty.showMobile || $$dirty.showDesktop) { $$invalidate('show', show = breakpoint === "sm" ? showMobile : showDesktop); }
		if ($$dirty.showWithScrim || $$dirty.right) { $$invalidate('transitionProps', transitionProps = showWithScrim
        ? {
            duration: 200,
            x: right ? 300 : -300,
            opacity: 1,
            easing: cubicIn
          }
        : { x: 0 }); }
	};

	return {
		right,
		persistent,
		elevation,
		showMobile,
		showDesktop,
		breakpoint,
		asideClasses,
		navClasses,
		hide,
		showWithScrim,
		show,
		transitionProps,
		click_handler,
		$$slots,
		$$scope
	};
}

class NavigationDrawer extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$c, create_fragment$d, safe_not_equal, ["right", "persistent", "elevation", "showMobile", "showDesktop", "breakpoint", "asideClasses", "navClasses"]);
	}

	get right() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set right(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get persistent() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set persistent(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get elevation() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set elevation(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get showMobile() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set showMobile(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get showDesktop() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set showDesktop(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get breakpoint() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set breakpoint(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get asideClasses() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set asideClasses(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get navClasses() {
		throw new Error("<NavigationDrawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set navClasses(value) {
		throw new Error("<NavigationDrawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (!stop) {
                return; // not ready
            }
            subscribers.forEach((s) => s[1]());
            subscribers.forEach((s) => s[0](value));
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const right = writable(false);
const persistent = writable(true);
const elevation = writable(false);
const showNav = writable(true);
const showNavMobile = writable(false);

function calcBreakpoint(width) {
  if (width > 1279) {
    return "xl";
  }
  if (width > 1023) {
    return "lg";
  }
  if (width > 767) {
    return "md";
  }
  return "sm";
}

function breakpoint() {
  if (typeof window === "undefined") return writable(false);

  const store = writable(calcBreakpoint(window.innerWidth));

  const onResize = ({ target }) => store.set(calcBreakpoint(target.innerWidth));

  window.addEventListener("resize", onResize);
  onDestroy(() => window.removeListener(onResize));

  return {
    subscribe: store.subscribe
  };
}

/* src\routes\Home.svelte generated by Svelte v3.6.7 */

const file$d = "src\\routes\\Home.svelte";

function create_fragment$e(ctx) {
	var h1, t_1, p;

	return {
		c: function create() {
			h1 = element("h1");
			h1.textContent = "Home";
			t_1 = space();
			p = element("p");
			p.textContent = "Welcome to my website";
			add_location(h1, file$d, 0, 0, 0);
			add_location(p, file$d, 1, 0, 15);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t_1, anchor);
			insert(target, p, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(h1);
				detach(t_1);
				detach(p);
			}
		}
	};
}

class Home extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$e, safe_not_equal, []);
	}
}

/* node_modules\smelte\src\components\Card\Card.svelte generated by Svelte v3.6.7 */

const file$e = "node_modules\\smelte\\src\\components\\Card\\Card.svelte";

const get_actions_slot_changes = () => ({});
const get_actions_slot_context = () => ({});

const get_text_slot_changes = () => ({});
const get_text_slot_context = () => ({});

const get_media_slot_changes = () => ({});
const get_media_slot_context = () => ({});

const get_title_slot_changes = () => ({});
const get_title_slot_context = () => ({});

function create_fragment$f(ctx) {
	var div, t0, t1, t2, t3, div_class_value, current;

	const title_slot_1 = ctx.$$slots.title;
	const title_slot = create_slot(title_slot_1, ctx, get_title_slot_context);

	const media_slot_1 = ctx.$$slots.media;
	const media_slot = create_slot(media_slot_1, ctx, get_media_slot_context);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	const text_slot_1 = ctx.$$slots.text;
	const text_slot = create_slot(text_slot_1, ctx, get_text_slot_context);

	const actions_slot_1 = ctx.$$slots.actions;
	const actions_slot = create_slot(actions_slot_1, ctx, get_actions_slot_context);

	return {
		c: function create() {
			div = element("div");

			if (title_slot) title_slot.c();
			t0 = space();

			if (media_slot) media_slot.c();
			t1 = space();

			if (default_slot) default_slot.c();
			t2 = space();

			if (text_slot) text_slot.c();
			t3 = space();

			if (actions_slot) actions_slot.c();

			attr(div, "class", div_class_value = "" + ctx.c + " " + (ctx.hover ? 'elevation-1 hover:elevation-8' : '') + " " + ctx.wrapperClasses);
			add_location(div, file$e, 6, 0, 146);
		},

		l: function claim(nodes) {
			if (title_slot) title_slot.l(div_nodes);

			if (media_slot) media_slot.l(div_nodes);

			if (default_slot) default_slot.l(div_nodes);

			if (text_slot) text_slot.l(div_nodes);

			if (actions_slot) actions_slot.l(div_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			if (title_slot) {
				title_slot.m(div, null);
			}

			append(div, t0);

			if (media_slot) {
				media_slot.m(div, null);
			}

			append(div, t1);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append(div, t2);

			if (text_slot) {
				text_slot.m(div, null);
			}

			append(div, t3);

			if (actions_slot) {
				actions_slot.m(div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (title_slot && title_slot.p && changed.$$scope) {
				title_slot.p(get_slot_changes(title_slot_1, ctx, changed, get_title_slot_changes), get_slot_context(title_slot_1, ctx, get_title_slot_context));
			}

			if (media_slot && media_slot.p && changed.$$scope) {
				media_slot.p(get_slot_changes(media_slot_1, ctx, changed, get_media_slot_changes), get_slot_context(media_slot_1, ctx, get_media_slot_context));
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (text_slot && text_slot.p && changed.$$scope) {
				text_slot.p(get_slot_changes(text_slot_1, ctx, changed, get_text_slot_changes), get_slot_context(text_slot_1, ctx, get_text_slot_context));
			}

			if (actions_slot && actions_slot.p && changed.$$scope) {
				actions_slot.p(get_slot_changes(actions_slot_1, ctx, changed, get_actions_slot_changes), get_slot_context(actions_slot_1, ctx, get_actions_slot_context));
			}

			if ((!current || changed.c || changed.hover || changed.wrapperClasses) && div_class_value !== (div_class_value = "" + ctx.c + " " + (ctx.hover ? 'elevation-1 hover:elevation-8' : '') + " " + ctx.wrapperClasses)) {
				attr(div, "class", div_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(title_slot, local);
			transition_in(media_slot, local);
			transition_in(default_slot, local);
			transition_in(text_slot, local);
			transition_in(actions_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(title_slot, local);
			transition_out(media_slot, local);
			transition_out(default_slot, local);
			transition_out(text_slot, local);
			transition_out(actions_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (title_slot) title_slot.d(detaching);

			if (media_slot) media_slot.d(detaching);

			if (default_slot) default_slot.d(detaching);

			if (text_slot) text_slot.d(detaching);

			if (actions_slot) actions_slot.d(detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { hover = true, c = "", wrapperClasses = "rounded inline-flex flex-col overflow-hidden" } = $$props;

	const writable_props = ['hover', 'c', 'wrapperClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Card> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('hover' in $$props) $$invalidate('hover', hover = $$props.hover);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		hover,
		c,
		wrapperClasses,
		$$slots,
		$$scope
	};
}

class Card extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$d, create_fragment$f, safe_not_equal, ["hover", "c", "wrapperClasses"]);
	}

	get hover() {
		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hover(value) {
		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Card\Title.svelte generated by Svelte v3.6.7 */

const file$f = "node_modules\\smelte\\src\\components\\Card\\Title.svelte";

function create_fragment$g(ctx) {
	var div4, div0, img, t0, div3, div1, t1, t2, div2, t3, div4_class_value;

	return {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			img = element("img");
			t0 = space();
			div3 = element("div");
			div1 = element("div");
			t1 = text(ctx.title);
			t2 = space();
			div2 = element("div");
			t3 = text(ctx.subheader);
			attr(img, "class", "rounded-full");
			attr(img, "width", "44");
			attr(img, "height", "44");
			attr(img, "src", ctx.avatar);
			attr(img, "alt", "avatar");
			toggle_class(img, "hidden", !ctx.avatar);
			add_location(img, file$f, 12, 4, 257);
			add_location(div0, file$f, 11, 2, 247);
			attr(div1, "class", "font-medium text-lg");
			toggle_class(div1, "hidden", !ctx.title);
			add_location(div1, file$f, 21, 4, 433);
			attr(div2, "class", "text-sm text-gray-600 pt-0");
			toggle_class(div2, "hidden", !ctx.subheader);
			add_location(div2, file$f, 22, 4, 506);
			attr(div3, "class", "pl-4 py-2");
			add_location(div3, file$f, 20, 2, 405);
			attr(div4, "class", div4_class_value = "" + ctx.c + " " + ctx.wrapperClasses);
			add_location(div4, file$f, 10, 0, 210);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			append(div0, img);
			append(div4, t0);
			append(div4, div3);
			append(div3, div1);
			append(div1, t1);
			append(div3, t2);
			append(div3, div2);
			append(div2, t3);
		},

		p: function update(changed, ctx) {
			if (changed.avatar) {
				attr(img, "src", ctx.avatar);
				toggle_class(img, "hidden", !ctx.avatar);
			}

			if (changed.title) {
				set_data(t1, ctx.title);
				toggle_class(div1, "hidden", !ctx.title);
			}

			if (changed.subheader) {
				set_data(t3, ctx.subheader);
				toggle_class(div2, "hidden", !ctx.subheader);
			}

			if ((changed.c || changed.wrapperClasses) && div4_class_value !== (div4_class_value = "" + ctx.c + " " + ctx.wrapperClasses)) {
				attr(div4, "class", div4_class_value);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { c = "", hover = true, title = "", subheader = "", avatar = "", wrapperClasses = "flex px-4 py-2 items-center" } = $$props;

	const writable_props = ['c', 'hover', 'title', 'subheader', 'avatar', 'wrapperClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Title> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('hover' in $$props) $$invalidate('hover', hover = $$props.hover);
		if ('title' in $$props) $$invalidate('title', title = $$props.title);
		if ('subheader' in $$props) $$invalidate('subheader', subheader = $$props.subheader);
		if ('avatar' in $$props) $$invalidate('avatar', avatar = $$props.avatar);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
	};

	return {
		c,
		hover,
		title,
		subheader,
		avatar,
		wrapperClasses
	};
}

class Title extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$e, create_fragment$g, safe_not_equal, ["c", "hover", "title", "subheader", "avatar", "wrapperClasses"]);
	}

	get c() {
		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hover() {
		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hover(value) {
		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get title() {
		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get subheader() {
		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subheader(value) {
		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get avatar() {
		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set avatar(value) {
		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

var Card$1 = {
  Card,
  Title
};

/* node_modules\smelte\src\components\Chip\Chip.svelte generated by Svelte v3.6.7 */

const file$g = "node_modules\\smelte\\src\\components\\Chip\\Chip.svelte";

// (59:0) {#if value}
function create_if_block$7(ctx) {
	var span1, button, t0, span0, t1, span1_class_value, span1_outro, current, dispose;

	var if_block0 = (ctx.icon) && create_if_block_2$1(ctx);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	var if_block1 = (ctx.removable) && create_if_block_1$4(ctx);

	return {
		c: function create() {
			span1 = element("span");
			button = element("button");
			if (if_block0) if_block0.c();
			t0 = space();
			span0 = element("span");

			if (default_slot) default_slot.c();
			t1 = space();
			if (if_block1) if_block1.c();

			attr(span0, "class", "px-2 text-sm");
			add_location(span0, file$g, 72, 6, 2343);
			attr(button, "class", "flex items-center rounded-full bg-gray-300 px-2 py-1 svelte-12hj6pe");
			toggle_class(button, "outlined", ctx.outlined);
			toggle_class(button, "selected", ctx.selected);
			toggle_class(button, "ripple-primary", ctx.selectable);
			add_location(button, file$g, 60, 4, 2005);
			attr(span1, "class", span1_class_value = "" + ctx.c + " mx-1 inline-block" + " svelte-12hj6pe");
			add_location(span1, file$g, 59, 2, 1934);

			dispose = [
				listen(button, "click", ctx.click_handler),
				listen(button, "click", ctx.select)
			];
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(span0_nodes);
		},

		m: function mount(target, anchor) {
			insert(target, span1, anchor);
			append(span1, button);
			if (if_block0) if_block0.m(button, null);
			append(button, t0);
			append(button, span0);

			if (default_slot) {
				default_slot.m(span0, null);
			}

			append(button, t1);
			if (if_block1) if_block1.m(button, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.icon) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_2$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(button, t0);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (ctx.removable) {
				if (if_block1) {
					if_block1.p(changed, ctx);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_1$4(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(button, null);
				}
			} else if (if_block1) {
				group_outros();
				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});
				check_outros();
			}

			if (changed.outlined) {
				toggle_class(button, "outlined", ctx.outlined);
			}

			if (changed.selected) {
				toggle_class(button, "selected", ctx.selected);
			}

			if (changed.selectable) {
				toggle_class(button, "ripple-primary", ctx.selectable);
			}

			if ((!current || changed.c) && span1_class_value !== (span1_class_value = "" + ctx.c + " mx-1 inline-block" + " svelte-12hj6pe")) {
				attr(span1, "class", span1_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(default_slot, local);
			transition_in(if_block1);

			if (span1_outro) span1_outro.end(1);

			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			transition_out(default_slot, local);
			transition_out(if_block1);

			span1_outro = create_out_transition(span1, scale, { duration: 100 });

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span1);
			}

			if (if_block0) if_block0.d();

			if (default_slot) default_slot.d(detaching);
			if (if_block1) if_block1.d();

			if (detaching) {
				if (span1_outro) span1_outro.end();
			}

			run_all(dispose);
		}
	};
}

// (68:6) {#if icon}
function create_if_block_2$1(ctx) {
	var current;

	var icon_1 = new Icon({
		props: {
		small: true,
		c: ctx.selected ? 'text-primary-400' : 'text-gray-600',
		$$slots: { default: [create_default_slot_1$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon_1.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon_1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_1_changes = {};
			if (changed.selected) icon_1_changes.c = ctx.selected ? 'text-primary-400' : 'text-gray-600';
			if (changed.$$scope || changed.icon) icon_1_changes.$$scope = { changed, ctx };
			icon_1.$set(icon_1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon_1, detaching);
		}
	};
}

// (69:8) <Icon small c={selected ? 'text-primary-400' : 'text-gray-600'}>
function create_default_slot_1$2(ctx) {
	var t;

	return {
		c: function create() {
			t = text(ctx.icon);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.icon) {
				set_data(t, ctx.icon);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (76:6) {#if removable}
function create_if_block_1$4(ctx) {
	var span, span_class_value, current, dispose;

	var icon_1 = new Icon({
		props: {
		c: "text-white",
		xs: true,
		$$slots: { default: [create_default_slot$5] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			span = element("span");
			icon_1.$$.fragment.c();
			attr(span, "class", span_class_value = "rounded-full p-1/2 inline-flex items-center cursor-pointer " + ctx.hoverClass + " svelte-12hj6pe");
			toggle_class(span, "bg-gray-500", !ctx.selected);
			toggle_class(span, "bg-primary-400", ctx.selected);
			add_location(span, file$g, 76, 8, 2432);
			dispose = listen(span, "click", stop_propagation(ctx.close));
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			mount_component(icon_1, span, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_1_changes = {};
			if (changed.$$scope) icon_1_changes.$$scope = { changed, ctx };
			icon_1.$set(icon_1_changes);

			if ((!current || changed.hoverClass) && span_class_value !== (span_class_value = "rounded-full p-1/2 inline-flex items-center cursor-pointer " + ctx.hoverClass + " svelte-12hj6pe")) {
				attr(span, "class", span_class_value);
			}

			if ((changed.hoverClass || changed.selected)) {
				toggle_class(span, "bg-gray-500", !ctx.selected);
				toggle_class(span, "bg-primary-400", ctx.selected);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon_1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon_1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}

			destroy_component(icon_1, );

			dispose();
		}
	};
}

// (82:10) <Icon c="text-white" xs>
function create_default_slot$5(ctx) {
	var t;

	return {
		c: function create() {
			t = text("clear");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$h(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.value) && create_if_block$7(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.value) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$7(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	

  let { c = '', removable = false, icon = '', outlined = false, selected = false, selectable = true } = $$props;

  let value = true;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch("close");
    $$invalidate('value', value = false);
  }

  function select() {
    if (!selectable) return;

    $$invalidate('selected', selected = true);
  }

	const writable_props = ['c', 'removable', 'icon', 'outlined', 'selected', 'selectable'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Chip> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('removable' in $$props) $$invalidate('removable', removable = $$props.removable);
		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
		if ('outlined' in $$props) $$invalidate('outlined', outlined = $$props.outlined);
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('selectable' in $$props) $$invalidate('selectable', selectable = $$props.selectable);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	let hoverClass;

	$$self.$$.update = ($$dirty = { selected: 1 }) => {
		if ($$dirty.selected) { $$invalidate('hoverClass', hoverClass = selected ? "hover:bg-primary-300" : "hover:bg-gray-400"); }
	};

	return {
		c,
		removable,
		icon,
		outlined,
		selected,
		selectable,
		value,
		close,
		select,
		hoverClass,
		click_handler,
		$$slots,
		$$scope
	};
}

class Chip extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$f, create_fragment$h, safe_not_equal, ["c", "removable", "icon", "outlined", "selected", "selectable"]);
	}

	get c() {
		throw new Error("<Chip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Chip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get removable() {
		throw new Error("<Chip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set removable(value) {
		throw new Error("<Chip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get icon() {
		throw new Error("<Chip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<Chip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlined() {
		throw new Error("<Chip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlined(value) {
		throw new Error("<Chip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selected() {
		throw new Error("<Chip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<Chip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selectable() {
		throw new Error("<Chip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectable(value) {
		throw new Error("<Chip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var prism = createCommonjsModule(function (module) {
/* **********************************************
     Begin prism-core.js
********************************************** */

var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function (_self){

// Private helper vars
var lang = /\blang(?:uage)?-([\w-]+)\b/i;
var uniqueId = 0;

var _ = {
	manual: _self.Prism && _self.Prism.manual,
	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (Array.isArray(tokens)) {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).slice(8, -1);
		},

		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function deepClone(o, visited) {
			var clone, id, type = _.util.type(o);
			visited = visited || {};

			switch (type) {
				case 'Object':
					id = _.util.objId(o);
					if (visited[id]) {
						return visited[id];
					}
					clone = {};
					visited[id] = clone;

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = deepClone(o[key], visited);
						}
					}

					return clone;

				case 'Array':
					id = _.util.objId(o);
					if (visited[id]) {
						return visited[id];
					}
					clone = [];
					visited[id] = clone;

					o.forEach(function (v, i) {
						clone[i] = deepClone(v, visited);
					});

					return clone;

				default:
					return o;
			}
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need an object and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			var ret = {};

			for (var token in grammar) {
				if (grammar.hasOwnProperty(token)) {

					if (token == before) {
						for (var newToken in insert) {
							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					// Do not insert token which also occur in insert. See #1525
					if (!insert.hasOwnProperty(token)) {
						ret[token] = grammar[token];
					}
				}
			}

			var old = root[inside];
			root[inside] = ret;

			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === old && key != inside) {
					this[key] = ret;
				}
			});

			return ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function DFS(o, callback, type, visited) {
			visited = visited || {};

			var objId = _.util.objId;

			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					var property = o[i],
					    propertyType = _.util.type(property);

					if (propertyType === 'Object' && !visited[objId(property)]) {
						visited[objId(property)] = true;
						DFS(property, callback, null, visited);
					}
					else if (propertyType === 'Array' && !visited[objId(property)]) {
						visited[objId(property)] = true;
						DFS(property, callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},

	highlightAll: function(async, callback) {
		_.highlightAllUnder(document, async, callback);
	},

	highlightAllUnder: function(container, async, callback) {
		var env = {
			callback: callback,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};

		_.hooks.run("before-highlightall", env);

		var elements = env.elements || container.querySelectorAll(env.selector);

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1].toLowerCase();
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		if (element.parentNode) {
			// Set language on the parent, for styling
			parent = element.parentNode;

			if (/pre/i.test(parent.nodeName)) {
				parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
			}
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		var insertHighlightedCode = function (highlightedCode) {
			env.highlightedCode = highlightedCode;

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
			callback && callback.call(env.element);
		};

		_.hooks.run('before-sanity-check', env);

		if (!env.code) {
			_.hooks.run('complete', env);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (!env.grammar) {
			insertHighlightedCode(_.util.encode(env.code));
			return;
		}

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				insertHighlightedCode(evt.data);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
		}
	},

	highlight: function (text, grammar, language) {
		var env = {
			code: text,
			grammar: grammar,
			language: language
		};
		_.hooks.run('before-tokenize', env);
		env.tokens = _.tokenize(env.code, env.grammar);
		_.hooks.run('after-tokenize', env);
		return Token.stringify(_.util.encode(env.tokens), env.language);
	},

	matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
		for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			if (token == target) {
				return;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					greedy = !!pattern.greedy,
					lookbehindLength = 0,
					alias = pattern.alias;

				if (greedy && !pattern.pattern.global) {
					// Without the global flag, lastIndex won't work
					var flags = pattern.pattern.toString().match(/[imuy]*$/)[0];
					pattern.pattern = RegExp(pattern.pattern.source, flags + "g");
				}

				pattern = pattern.pattern || pattern;

				// Don’t cache length as it changes during the loop
				for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						return;
					}

					if (str instanceof Token) {
						continue;
					}

					if (greedy && i != strarr.length - 1) {
						pattern.lastIndex = pos;
						var match = pattern.exec(text);
						if (!match) {
							break;
						}

						var from = match.index + (lookbehind ? match[1].length : 0),
						    to = match.index + match[0].length,
						    k = i,
						    p = pos;

						for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
							p += strarr[k].length;
							// Move the index i to the element in strarr that is closest to from
							if (from >= p) {
								++i;
								pos = p;
							}
						}

						// If strarr[i] is a Token, then the match starts inside another Token, which is invalid
						if (strarr[i] instanceof Token) {
							continue;
						}

						// Number of tokens to delete and replace with the new match
						delNum = k - i;
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						pattern.lastIndex = 0;

						var match = pattern.exec(str),
							delNum = 1;
					}

					if (!match) {
						if (oneshot) {
							break;
						}

						continue;
					}

					if(lookbehind) {
						lookbehindLength = match[1] ? match[1].length : 0;
					}

					var from = match.index + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    to = from + match.length,
					    before = str.slice(0, from),
					    after = str.slice(to);

					var args = [i, delNum];

					if (before) {
						++i;
						pos += before.length;
						args.push(before);
					}

					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

					args.push(wrapped);

					if (after) {
						args.push(after);
					}

					Array.prototype.splice.apply(strarr, args);

					if (delNum != 1)
						_.matchGrammar(text, strarr, grammar, i, pos, true, token);

					if (oneshot)
						break;
				}
			}
		}
	},

	tokenize: function(text, grammar) {
		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		_.matchGrammar(text, strarr, grammar, 0, 0, false);

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	},

	Token: Token
};

_self.Prism = _;

function Token(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	// Copy of the full string this token was created from
	this.length = (matchedStr || "").length|0;
	this.greedy = !!greedy;
}

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (Array.isArray(o)) {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (o.alias) {
		var aliases = Array.isArray(o.alias) ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = Object.keys(env.attributes).map(function(name) {
		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}).join(' ');

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _;
	}

	if (!_.disableWorkerMessageHandler) {
		// In worker
		_self.addEventListener('message', function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code,
				immediateClose = message.immediateClose;

			_self.postMessage(_.highlight(code, _.languages[lang], lang));
			if (immediateClose) {
				_self.close();
			}
		}, false);
	}

	return _;
}

//Get current script and highlight
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

if (script) {
	_.filename = script.src;

	if (!_.manual && !script.hasAttribute('data-manual')) {
		if(document.readyState !== "loading") {
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(_.highlightAll);
			} else {
				window.setTimeout(_.highlightAll, 16);
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', _.highlightAll);
		}
	}
}

return _;

})(_self);

if ( module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof commonjsGlobal !== 'undefined') {
	commonjsGlobal.Prism = Prism;
}


/* **********************************************
     Begin prism-markup.js
********************************************** */

Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': /<!DOCTYPE[\s\S]+?>/i,
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
				inside: {
					'punctuation': [
						/^=/,
						{
							pattern: /^(\s*)["']|["']$/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
	/**
	 * Adds an inlined language to markup.
	 *
	 * An example of an inlined language is CSS with `<style>` tags.
	 *
	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addInlined('style', 'css');
	 */
	value: function addInlined(tagName, lang) {
		var includedCdataInside = {};
		includedCdataInside['language-' + lang] = {
			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
			lookbehind: true,
			inside: Prism.languages[lang]
		};
		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

		var inside = {
			'included-cdata': {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: includedCdataInside
			}
		};
		inside['language-' + lang] = {
			pattern: /[\s\S]+/,
			inside: Prism.languages[lang]
		};

		var def = {};
		def[tagName] = {
			pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[[\s\S]*?\]\]>\s*|[\s\S])*?(?=<\/__>)/.source.replace(/__/g, tagName), 'i'),
			lookbehind: true,
			greedy: true,
			inside: inside
		};

		Prism.languages.insertBefore('markup', 'cdata', def);
	}
});

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;


/* **********************************************
     Begin prism-css.js
********************************************** */

(function (Prism) {

	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

	Prism.languages.css = {
		'comment': /\/\*[\s\S]*?\*\//,
		'atrule': {
			pattern: /@[\w-]+?[\s\S]*?(?:;|(?=\s*\{))/i,
			inside: {
				'rule': /@[\w-]+/
				// See rest below
			}
		},
		'url': RegExp('url\\((?:' + string.source + '|.*?)\\)', 'i'),
		'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
		'string': {
			pattern: string,
			greedy: true
		},
		'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
		'important': /!important\b/i,
		'function': /[-a-z0-9]+(?=\()/i,
		'punctuation': /[(){};:,]/
	};

	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

	var markup = Prism.languages.markup;
	if (markup) {
		markup.tag.addInlined('style', 'css');

		Prism.languages.insertBefore('inside', 'attr-value', {
			'style-attr': {
				pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
				inside: {
					'attr-name': {
						pattern: /^\s*style/i,
						inside: markup.tag.inside
					},
					'punctuation': /^\s*=\s*['"]|['"]\s*$/,
					'attr-value': {
						pattern: /.+/i,
						inside: Prism.languages.css
					}
				},
				alias: 'language-css'
			}
		}, markup.tag);
	}

}(Prism));


/* **********************************************
     Begin prism-clike.js
********************************************** */

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /[.\\]/
		}
	},
	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(?:true|false)\b/,
	'function': /\w+(?=\()/,
	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};


/* **********************************************
     Begin prism-javascript.js
********************************************** */

Prism.languages.javascript = Prism.languages.extend('clike', {
	'class-name': [
		Prism.languages.clike['class-name'],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
			lookbehind: true
		}
	],
	'keyword': [
		{
			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		},
	],
	'number': /\b(?:(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+)n?|\d+n|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	'operator': /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,
		lookbehind: true,
		greedy: true
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
		alias: 'function'
	},
	'parameter': [
		{
			pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
			inside: Prism.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		}
	],
	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\${[^}]+}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\${|}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.markup.tag.addInlined('script', 'javascript');
}

Prism.languages.js = Prism.languages.javascript;


/* **********************************************
     Begin prism-file-highlight.js
********************************************** */

(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	/**
	 * @param {Element} [container=document]
	 */
	self.Prism.fileHighlight = function(container) {
		container = container || document;

		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};

		Array.prototype.slice.call(container.querySelectorAll('pre[data-src]')).forEach(function (pre) {
			// ignore if already loaded
			if (pre.hasAttribute('data-src-loaded')) {
				return;
			}

			// load current
			var src = pre.getAttribute('data-src');

			var language, parent = pre;
			var lang = /\blang(?:uage)?-([\w-]+)\b/i;
			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}

			if (parent) {
				language = (pre.className.match(lang) || [, ''])[1];
			}

			if (!language) {
				var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
				language = Extensions[extension] || extension;
			}

			var code = document.createElement('code');
			code.className = 'language-' + language;

			pre.textContent = '';

			code.textContent = 'Loading…';

			pre.appendChild(code);

			var xhr = new XMLHttpRequest();

			xhr.open('GET', src, true);

			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {

					if (xhr.status < 400 && xhr.responseText) {
						code.textContent = xhr.responseText;

						Prism.highlightElement(code);
						// mark as loaded
						pre.setAttribute('data-src-loaded', '');
					}
					else if (xhr.status >= 400) {
						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
					}
					else {
						code.textContent = '✖ Error: File does not exist or is empty';
					}
				}
			};

			xhr.send(null);
		});

		if (Prism.plugins.toolbar) {
			Prism.plugins.toolbar.registerButton('download-file', function (env) {
				var pre = env.element.parentNode;
				if (!pre || !/pre/i.test(pre.nodeName) || !pre.hasAttribute('data-src') || !pre.hasAttribute('data-download-link')) {
					return;
				}
				var src = pre.getAttribute('data-src');
				var a = document.createElement('a');
				a.textContent = pre.getAttribute('data-download-link-label') || 'Download';
				a.setAttribute('download', '');
				a.href = src;
				return a;
			});
		}

	};

	document.addEventListener('DOMContentLoaded', function () {
		// execute inside handler, for dropping Event as argument
		self.Prism.fileHighlight();
	});

})();
});

/* node_modules\smelte\src\components\Code\Code.svelte generated by Svelte v3.6.7 */

const file$h = "node_modules\\smelte\\src\\components\\Code\\Code.svelte";

function create_fragment$i(ctx) {
	var pre, code_1, pre_class_value;

	return {
		c: function create() {
			pre = element("pre");
			code_1 = element("code");
			add_location(code_1, file$h, 10, 2, 218);
			attr(pre, "class", pre_class_value = "language-" + ctx.lang);
			add_location(pre, file$h, 9, 0, 186);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, pre, anchor);
			append(pre, code_1);
			code_1.innerHTML = ctx.html;
		},

		p: function update(changed, ctx) {
			if ((changed.lang) && pre_class_value !== (pre_class_value = "language-" + ctx.lang)) {
				attr(pre, "class", pre_class_value);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(pre);
			}
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let { code = "", lang = "javascript" } = $$props;

  const html = prism.highlight(code, prism.languages[lang], "javascript");

	const writable_props = ['code', 'lang'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Code> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('code' in $$props) $$invalidate('code', code = $$props.code);
		if ('lang' in $$props) $$invalidate('lang', lang = $$props.lang);
	};

	return { code, lang, html };
}

class Code extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$g, create_fragment$i, safe_not_equal, ["code", "lang"]);
	}

	get code() {
		throw new Error("<Code>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set code(value) {
		throw new Error("<Code>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get lang() {
		throw new Error("<Code>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set lang(value) {
		throw new Error("<Code>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Dialog\Dialog.svelte generated by Svelte v3.6.7 */

const file$i = "node_modules\\smelte\\src\\components\\Dialog\\Dialog.svelte";

const get_actions_slot_changes$1 = () => ({});
const get_actions_slot_context$1 = () => ({});

const get_title_slot_changes$1 = () => ({});
const get_title_slot_context$1 = () => ({});

// (16:0) {#if value}
function create_if_block$8(ctx) {
	var div4, t0, div3, div2, div0, t1, t2, div1, div2_class_value, div2_transition, current;

	var scrim = new Scrim$1({ $$inline: true });
	scrim.$on("click", ctx.click_handler);

	const title_slot_1 = ctx.$$slots.title;
	const title_slot = create_slot(title_slot_1, ctx, get_title_slot_context$1);

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	const actions_slot_1 = ctx.$$slots.actions;
	const actions_slot = create_slot(actions_slot_1, ctx, get_actions_slot_context$1);

	return {
		c: function create() {
			div4 = element("div");
			scrim.$$.fragment.c();
			t0 = space();
			div3 = element("div");
			div2 = element("div");
			div0 = element("div");

			if (title_slot) title_slot.c();
			t1 = space();

			if (default_slot) default_slot.c();
			t2 = space();
			div1 = element("div");

			if (actions_slot) actions_slot.c();

			attr(div0, "class", ctx.titleClasses);
			add_location(div0, file$i, 22, 8, 790);

			attr(div1, "class", ctx.actionsClasses);
			add_location(div1, file$i, 26, 8, 889);
			attr(div2, "class", div2_class_value = "" + ctx.c + " " + ctx.wrapperClasses);
			add_location(div2, file$i, 19, 6, 696);
			attr(div3, "class", "h-full w-full absolute flex items-center justify-center");
			add_location(div3, file$i, 18, 4, 620);
			attr(div4, "class", "fixed w-full h-full top-0 left-0 z-30");
			add_location(div4, file$i, 16, 2, 517);
		},

		l: function claim(nodes) {
			if (title_slot) title_slot.l(div0_nodes);

			if (default_slot) default_slot.l(div2_nodes);

			if (actions_slot) actions_slot.l(div1_nodes);
		},

		m: function mount(target, anchor) {
			insert(target, div4, anchor);
			mount_component(scrim, div4, null);
			append(div4, t0);
			append(div4, div3);
			append(div3, div2);
			append(div2, div0);

			if (title_slot) {
				title_slot.m(div0, null);
			}

			append(div2, t1);

			if (default_slot) {
				default_slot.m(div2, null);
			}

			append(div2, t2);
			append(div2, div1);

			if (actions_slot) {
				actions_slot.m(div1, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (title_slot && title_slot.p && changed.$$scope) {
				title_slot.p(get_slot_changes(title_slot_1, ctx, changed, get_title_slot_changes$1), get_slot_context(title_slot_1, ctx, get_title_slot_context$1));
			}

			if (!current || changed.titleClasses) {
				attr(div0, "class", ctx.titleClasses);
			}

			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (actions_slot && actions_slot.p && changed.$$scope) {
				actions_slot.p(get_slot_changes(actions_slot_1, ctx, changed, get_actions_slot_changes$1), get_slot_context(actions_slot_1, ctx, get_actions_slot_context$1));
			}

			if (!current || changed.actionsClasses) {
				attr(div1, "class", ctx.actionsClasses);
			}

			if ((!current || changed.c || changed.wrapperClasses) && div2_class_value !== (div2_class_value = "" + ctx.c + " " + ctx.wrapperClasses)) {
				attr(div2, "class", div2_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(scrim.$$.fragment, local);

			transition_in(title_slot, local);
			transition_in(default_slot, local);
			transition_in(actions_slot, local);

			add_render_callback(() => {
				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, ctx.transitionProps, true);
				div2_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(scrim.$$.fragment, local);
			transition_out(title_slot, local);
			transition_out(default_slot, local);
			transition_out(actions_slot, local);

			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, ctx.transitionProps, false);
			div2_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}

			destroy_component(scrim, );

			if (title_slot) title_slot.d(detaching);

			if (default_slot) default_slot.d(detaching);

			if (actions_slot) actions_slot.d(detaching);

			if (detaching) {
				if (div2_transition) div2_transition.end();
			}
		}
	};
}

function create_fragment$j(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.value) && create_if_block$8(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.value) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$8(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function instance$h($$self, $$props, $$invalidate) {
	

  let { c = "", value, wrapperClasses = "items-center z-50 rounded bg-white p-4 elevation-4", titleClasses = "text-lg font-bold pb-4", actionsClasses = "flex w-full justify-end pt-4" } = $$props;

  const transitionProps = { duration: 150, easing: quadIn, delay: 150 };

	const writable_props = ['c', 'value', 'wrapperClasses', 'titleClasses', 'actionsClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Dialog> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler() {
		const $$result = (value = false);
		$$invalidate('value', value);
		return $$result;
	}

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('titleClasses' in $$props) $$invalidate('titleClasses', titleClasses = $$props.titleClasses);
		if ('actionsClasses' in $$props) $$invalidate('actionsClasses', actionsClasses = $$props.actionsClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		c,
		value,
		wrapperClasses,
		titleClasses,
		actionsClasses,
		transitionProps,
		click_handler,
		$$slots,
		$$scope
	};
}

class Dialog extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$h, create_fragment$j, safe_not_equal, ["c", "value", "wrapperClasses", "titleClasses", "actionsClasses"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.value === undefined && !('value' in props)) {
			console.warn("<Dialog> was created without expected prop 'value'");
		}
	}

	get c() {
		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get titleClasses() {
		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set titleClasses(value) {
		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get actionsClasses() {
		throw new Error("<Dialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set actionsClasses(value) {
		throw new Error("<Dialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\svelte-waypoint\src\Waypoint.svelte generated by Svelte v3.6.7 */

const file$j = "node_modules\\svelte-waypoint\\src\\Waypoint.svelte";

// (135:2) {#if visible}
function create_if_block$9(ctx) {
	var current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	return {
		c: function create() {
			if (default_slot) default_slot.c();
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$k(ctx) {
	var div, div_class_value, waypoint_action, current;

	var if_block = (ctx.visible) && create_if_block$9(ctx);

	return {
		c: function create() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", div_class_value = "" + (`wrapper ${ctx.c}`) + " svelte-a5tf4d");
			attr(div, "style", ctx.style);
			add_location(div, file$j, 133, 0, 3364);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			waypoint_action = ctx.waypoint.call(null, div) || {};
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.visible) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$9(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if ((!current || changed.c) && div_class_value !== (div_class_value = "" + (`wrapper ${ctx.c}`) + " svelte-a5tf4d")) {
				attr(div, "class", div_class_value);
			}

			if (!current || changed.style) {
				attr(div, "style", ctx.style);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
			if (waypoint_action && typeof waypoint_action.destroy === 'function') waypoint_action.destroy();
		}
	};
}

function throttleFn(fn, time) {
  let last, deferTimer;

  return () => {
    const now = +new Date;

    if (last && now < last + time) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn();
      }, time);
    } else {
      last = now;
      fn();
    }
  };
}

function instance$i($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();

  let { offset = 0, throttle = 250, c = '', style = '', once = true, threshold = 1.0 } = $$props;

  let visible = false;
  let wasVisible = false;
  let intersecting = false;
  let removeHandlers = () => {};

  function callEvents(wasVisible, observer, node) {
    if (visible && !wasVisible) {
      dispatch('enter');
      return;
    }

    if (wasVisible && !intersecting) {
      dispatch('leave');
    }

    if (once && wasVisible && !intersecting) {
      removeHandlers();
    }
  }

  function waypoint(node) {
    if (!window) return;

    if (window.IntersectionObserver && window.IntersectionObserverEntry) {
      const observer = new IntersectionObserver(([ { isIntersecting } ]) => {
        wasVisible = visible;

        intersecting = isIntersecting;

        if (wasVisible && once && !isIntersecting) {
          callEvents(wasVisible);
          return;
        }

        $$invalidate('visible', visible = isIntersecting);

        callEvents(wasVisible);
      }, {
        rootMargin: offset + 'px',
        threshold,
      });

      observer.observe(node);

      removeHandlers = () => observer.unobserve(node);

      return removeHandlers;
    }

    function checkIsVisible() {
      // Kudos https://github.com/twobin/react-lazyload/blob/master/src/index.jsx#L93
      if (!(node.offsetWidth || node.offsetHeight || node.getClientRects().length)) return;

      let top;
      let height;

      try {
        ({ top, height } = node.getBoundingClientRect());
      } catch (e) {
        ({ top, height } = defaultBoundingClientRect);
      }

      const windowInnerHeight = window.innerHeight
        || document.documentElement.clientHeight;

      wasVisible = visible;
      intersecting = (top - offset <= windowInnerHeight) &&
        (top + height + offset >= 0);

      if (wasVisible && once && !isIntersecting) {
        callEvents(wasVisible);
        return;
      }

      $$invalidate('visible', visible = intersecting);

      callEvents(wasVisible);
    }

    checkIsVisible();

    throttled = throttleFn(checkIsVisible, throttle);

    window.addEventListener('scroll', throttled);
    window.addEventListener('resize', throttled);

    removeHandlers = () => {
      window.removeEventListener('scroll', throttled);
      window.removeEventListener('resize', throttled);
    };

    return removeHandlers;
  }

	const writable_props = ['offset', 'throttle', 'c', 'style', 'once', 'threshold'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Waypoint> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('offset' in $$props) $$invalidate('offset', offset = $$props.offset);
		if ('throttle' in $$props) $$invalidate('throttle', throttle = $$props.throttle);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('style' in $$props) $$invalidate('style', style = $$props.style);
		if ('once' in $$props) $$invalidate('once', once = $$props.once);
		if ('threshold' in $$props) $$invalidate('threshold', threshold = $$props.threshold);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		offset,
		throttle,
		c,
		style,
		once,
		threshold,
		visible,
		waypoint,
		$$slots,
		$$scope
	};
}

class Waypoint extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$i, create_fragment$k, safe_not_equal, ["offset", "throttle", "c", "style", "once", "threshold"]);
	}

	get offset() {
		throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set offset(value) {
		throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get throttle() {
		throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set throttle(value) {
		throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get once() {
		throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set once(value) {
		throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get threshold() {
		throw new Error("<Waypoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set threshold(value) {
		throw new Error("<Waypoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Image\Image.svelte generated by Svelte v3.6.7 */

const file$k = "node_modules\\smelte\\src\\components\\Image\\Image.svelte";

const get_loading_slot_changes = () => ({});
const get_loading_slot_context = () => ({});

// (32:20) 
function create_if_block_2$2(ctx) {
	var current;

	const loading_slot_1 = ctx.$$slots.loading;
	const loading_slot = create_slot(loading_slot_1, ctx, get_loading_slot_context);

	return {
		c: function create() {
			if (loading_slot) loading_slot.c();
		},

		l: function claim(nodes) {
			if (loading_slot) loading_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (loading_slot) {
				loading_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (loading_slot && loading_slot.p && changed.$$scope) {
				loading_slot.p(get_slot_changes(loading_slot_1, ctx, changed, get_loading_slot_changes), get_slot_context(loading_slot_1, ctx, get_loading_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(loading_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(loading_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (loading_slot) loading_slot.d(detaching);
		}
	};
}

// (30:22) 
function create_if_block_1$5(ctx) {
	var img;

	return {
		c: function create() {
			img = element("img");
			attr(img, "class", ctx.c);
			attr(img, "src", ctx.thumbnail);
			attr(img, "alt", ctx.alt);
			attr(img, "width", ctx.width);
			attr(img, "height", ctx.height);
			add_location(img, file$k, 30, 4, 637);
		},

		m: function mount(target, anchor) {
			insert(target, img, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.c) {
				attr(img, "class", ctx.c);
			}

			if (changed.thumbnail) {
				attr(img, "src", ctx.thumbnail);
			}

			if (changed.alt) {
				attr(img, "alt", ctx.alt);
			}

			if (changed.width) {
				attr(img, "width", ctx.width);
			}

			if (changed.height) {
				attr(img, "height", ctx.height);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(img);
			}
		}
	};
}

// (28:2) {#if loaded}
function create_if_block$a(ctx) {
	var img;

	return {
		c: function create() {
			img = element("img");
			attr(img, "class", ctx.c);
			attr(img, "src", ctx.src);
			attr(img, "alt", ctx.alt);
			attr(img, "width", ctx.width);
			attr(img, "height", ctx.height);
			add_location(img, file$k, 28, 4, 563);
		},

		m: function mount(target, anchor) {
			insert(target, img, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.c) {
				attr(img, "class", ctx.c);
			}

			if (changed.src) {
				attr(img, "src", ctx.src);
			}

			if (changed.alt) {
				attr(img, "alt", ctx.alt);
			}

			if (changed.width) {
				attr(img, "width", ctx.width);
			}

			if (changed.height) {
				attr(img, "height", ctx.height);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(img);
			}
		}
	};
}

// (27:0) <Waypoint {c} once on:enter={load} style="height: {height}px" offset="0">
function create_default_slot$6(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$a,
		create_if_block_1$5,
		create_if_block_2$2
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.loaded) return 0;
		if (ctx.thumbnail) return 1;
		if (ctx.loading) return 2;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if (~current_block_type_index) if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				if (if_block) {
					group_outros();
					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});
					check_outros();
				}

				if (~current_block_type_index) {
					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				} else {
					if_block = null;
				}
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (~current_block_type_index) if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function create_fragment$l(ctx) {
	var current;

	var waypoint = new Waypoint({
		props: {
		c: ctx.c,
		once: true,
		style: "height: " + ctx.height + "px",
		offset: "0",
		$$slots: { default: [create_default_slot$6] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	waypoint.$on("enter", ctx.load);

	return {
		c: function create() {
			waypoint.$$.fragment.c();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(waypoint, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var waypoint_changes = {};
			if (changed.c) waypoint_changes.c = ctx.c;
			if (changed.height) waypoint_changes.style = "height: " + ctx.height + "px";
			if (changed.$$scope || changed.loaded || changed.c || changed.src || changed.alt || changed.width || changed.height || changed.thumbnail || changed.loading) waypoint_changes.$$scope = { changed, ctx };
			waypoint.$set(waypoint_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(waypoint.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(waypoint.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(waypoint, detaching);
		}
	};
}

function instance$j($$self, $$props, $$invalidate) {
	

  let { alt = "", width = "", height = "", src = "", thumbnail = "", c = "" } = $$props;

  let loaded = false;
  let loading = false;

  function load() {
    const img = new Image();
    img.src = src;
    $$invalidate('loading', loading = true);

    img.onload = () => {
      $$invalidate('loading', loading = false);
      $$invalidate('loaded', loaded = true);
    };
  }

	const writable_props = ['alt', 'width', 'height', 'src', 'thumbnail', 'c'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Image> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('alt' in $$props) $$invalidate('alt', alt = $$props.alt);
		if ('width' in $$props) $$invalidate('width', width = $$props.width);
		if ('height' in $$props) $$invalidate('height', height = $$props.height);
		if ('src' in $$props) $$invalidate('src', src = $$props.src);
		if ('thumbnail' in $$props) $$invalidate('thumbnail', thumbnail = $$props.thumbnail);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		alt,
		width,
		height,
		src,
		thumbnail,
		c,
		loaded,
		loading,
		load,
		$$slots,
		$$scope
	};
}

class Image_1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$j, create_fragment$l, safe_not_equal, ["alt", "width", "height", "src", "thumbnail", "c"]);
	}

	get alt() {
		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set alt(value) {
		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get width() {
		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get height() {
		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set height(value) {
		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get src() {
		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get thumbnail() {
		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set thumbnail(value) {
		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\TextField\TextField.svelte generated by Svelte v3.6.7 */

const file$l = "node_modules\\smelte\\src\\components\\TextField\\TextField.svelte";

const get_append_slot_changes = () => ({});
const get_append_slot_context = () => ({});

// (131:4) {#if append}
function create_if_block_4(ctx) {
	var div, div_class_value, current;

	var icon = new Icon({
		props: {
		reverse: ctx.appendReverse,
		c: ctx.focused ? ctx.txt() : 'text-gray-700',
		$$slots: { default: [create_default_slot$7] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			icon.$$.fragment.c();
			attr(div, "class", div_class_value = "" + ctx.appendBaseClasses(appendDefault) + " svelte-8az9n8");
			add_location(div, file$l, 131, 6, 4143);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(icon, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_changes = {};
			if (changed.appendReverse) icon_changes.reverse = ctx.appendReverse;
			if (changed.focused || changed.txt) icon_changes.c = ctx.focused ? ctx.txt() : 'text-gray-700';
			if (changed.$$scope || changed.append) icon_changes.$$scope = { changed, ctx };
			icon.$set(icon_changes);

			if ((!current || changed.appendBaseClasses) && div_class_value !== (div_class_value = "" + ctx.appendBaseClasses(appendDefault) + " svelte-8az9n8")) {
				attr(div, "class", div_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(icon, );
		}
	};
}

// (133:8) <Icon           reverse={appendReverse}           c={focused ? txt() : 'text-gray-700'}>
function create_default_slot$7(ctx) {
	var t;

	return {
		c: function create() {
			t = text(ctx.append);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if (changed.append) {
				set_data(t, ctx.append);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (168:38) 
function create_if_block_3(ctx) {
	var div, t, div_class_value, dispose;

	return {
		c: function create() {
			div = element("div");
			t = text(ctx.value);
			attr(div, "class", div_class_value = "select " + ctx.inputClasses + " svelte-8az9n8");
			add_location(div, file$l, 168, 6, 5071);

			dispose = [
				listen(div, "click", ctx.toggleFocused),
				listen(div, "change", ctx.change_handler_2),
				listen(div, "input", ctx.input_handler_2),
				listen(div, "click", ctx.click_handler_2),
				listen(div, "blur", ctx.blur_handler_2),
				listen(div, "focus", ctx.focus_handler_2)
			];
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},

		p: function update(changed, ctx) {
			if (changed.value) {
				set_data(t, ctx.value);
			}

			if ((changed.inputClasses) && div_class_value !== (div_class_value = "select " + ctx.inputClasses + " svelte-8az9n8")) {
				attr(div, "class", div_class_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			run_all(dispose);
		}
	};
}

// (154:34) 
function create_if_block_2$3(ctx) {
	var textarea_1, textarea_1_placeholder_value, dispose;

	return {
		c: function create() {
			textarea_1 = element("textarea");
			attr(textarea_1, "rows", ctx.rows);
			attr(textarea_1, "aria-label", ctx.label);
			attr(textarea_1, "class", "" + ctx.inputClasses + " svelte-8az9n8");
			attr(textarea_1, "placeholder", textarea_1_placeholder_value = !ctx.value ? ctx.placeholder : '');
			add_location(textarea_1, file$l, 154, 6, 4725);

			dispose = [
				listen(textarea_1, "input", ctx.textarea_1_input_handler),
				listen(textarea_1, "change", ctx.change_handler_1),
				listen(textarea_1, "input", ctx.input_handler_1),
				listen(textarea_1, "click", ctx.click_handler_1),
				listen(textarea_1, "focus", ctx.focus_handler_1),
				listen(textarea_1, "blur", ctx.blur_handler_1),
				listen(textarea_1, "focus", ctx.toggleFocused),
				listen(textarea_1, "blur", ctx.toggleFocused)
			];
		},

		m: function mount(target, anchor) {
			insert(target, textarea_1, anchor);

			textarea_1.value = ctx.value;
		},

		p: function update(changed, ctx) {
			if (changed.value) textarea_1.value = ctx.value;

			if (changed.rows) {
				attr(textarea_1, "rows", ctx.rows);
			}

			if (changed.label) {
				attr(textarea_1, "aria-label", ctx.label);
			}

			if (changed.inputClasses) {
				attr(textarea_1, "class", "" + ctx.inputClasses + " svelte-8az9n8");
			}

			if ((changed.value || changed.placeholder) && textarea_1_placeholder_value !== (textarea_1_placeholder_value = !ctx.value ? ctx.placeholder : '')) {
				attr(textarea_1, "placeholder", textarea_1_placeholder_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(textarea_1);
			}

			run_all(dispose);
		}
	};
}

// (141:4) {#if (!textarea && !select) || autocomplete}
function create_if_block_1$6(ctx) {
	var input, input_placeholder_value, dispose;

	return {
		c: function create() {
			input = element("input");
			attr(input, "aria-label", ctx.label);
			attr(input, "class", "" + ctx.inputClasses + " svelte-8az9n8");
			attr(input, "placeholder", input_placeholder_value = !ctx.value ? ctx.placeholder : '');
			add_location(input, file$l, 141, 6, 4401);

			dispose = [
				listen(input, "input", ctx.input_input_handler),
				listen(input, "focus", ctx.toggleFocused),
				listen(input, "blur", ctx.toggleFocused),
				listen(input, "blur", ctx.blur_handler),
				listen(input, "change", ctx.change_handler),
				listen(input, "input", ctx.input_handler),
				listen(input, "click", ctx.click_handler),
				listen(input, "focus", ctx.focus_handler)
			];
		},

		m: function mount(target, anchor) {
			insert(target, input, anchor);

			input.value = ctx.value;
		},

		p: function update(changed, ctx) {
			if (changed.value && (input.value !== ctx.value)) input.value = ctx.value;

			if (changed.label) {
				attr(input, "aria-label", ctx.label);
			}

			if (changed.inputClasses) {
				attr(input, "class", "" + ctx.inputClasses + " svelte-8az9n8");
			}

			if ((changed.value || changed.placeholder) && input_placeholder_value !== (input_placeholder_value = !ctx.value ? ctx.placeholder : '')) {
				attr(input, "placeholder", input_placeholder_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(input);
			}

			run_all(dispose);
		}
	};
}

// (192:2) {#if showHint}
function create_if_block$b(ctx) {
	var div, t, div_transition, current;

	return {
		c: function create() {
			div = element("div");
			t = text(ctx.showHint);
			attr(div, "class", "text-xs py-1 pl-4 absolute bottom-0 left-0");
			toggle_class(div, "text-gray-600", ctx.hint);
			toggle_class(div, "text-error-500", ctx.error);
			add_location(div, file$l, 192, 4, 5628);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!current || changed.showHint) {
				set_data(t, ctx.showHint);
			}

			if (changed.hint) {
				toggle_class(div, "text-gray-600", ctx.hint);
			}

			if (changed.error) {
				toggle_class(div, "text-error-500", ctx.error);
			}
		},

		i: function intro(local) {
			if (current) return;
			add_render_callback(() => {
				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -10, duration: 100, easing: quadOut }, true);
				div_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -10, duration: 100, easing: quadOut }, false);
			div_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
				if (div_transition) div_transition.end();
			}
		}
	};
}

function create_fragment$m(ctx) {
	var div4, div3, label_1, t0, t1, div0, div0_class_value, t2, t3, t4, div2, div1, div1_class_value, t5, current, dispose;

	const append_slot_1 = ctx.$$slots.append;
	const append_slot = create_slot(append_slot_1, ctx, get_append_slot_context);

	var if_block0 = (ctx.append) && create_if_block_4(ctx);

	function select_block_type(ctx) {
		if ((!ctx.textarea && !ctx.select) || ctx.autocomplete) return create_if_block_1$6;
		if (ctx.textarea && !ctx.select) return create_if_block_2$3;
		if (ctx.select && !ctx.autocomplete) return create_if_block_3;
	}

	var current_block_type = select_block_type(ctx);
	var if_block1 = current_block_type && current_block_type(ctx);

	var if_block2 = (ctx.showHint) && create_if_block$b(ctx);

	return {
		c: function create() {
			div4 = element("div");
			div3 = element("div");
			label_1 = element("label");
			t0 = text(ctx.label);
			t1 = space();
			div0 = element("div");

			if (append_slot) append_slot.c();
			t2 = space();
			if (if_block0) if_block0.c();
			t3 = space();
			if (if_block1) if_block1.c();
			t4 = space();
			div2 = element("div");
			div1 = element("div");
			t5 = space();
			if (if_block2) if_block2.c();
			attr(label_1, "class", "" + ctx.labelClasses + " svelte-8az9n8");
			add_location(label_1, file$l, 122, 4, 3971);

			attr(div0, "class", div0_class_value = "" + ctx.appendBaseClasses(appendDefault) + " svelte-8az9n8");
			add_location(div0, file$l, 126, 4, 4032);
			attr(div1, "class", div1_class_value = "mx-auto w-0 " + (ctx.focused ? ctx.bg() : "") + " svelte-8az9n8");
			set_style(div1, "height", "2px");
			set_style(div1, "transition", "width .2s ease");
			toggle_class(div1, "w-full", ctx.focused || ctx.error);
			toggle_class(div1, "bg-error-500", ctx.error);
			add_location(div1, file$l, 183, 6, 5397);
			attr(div2, "class", "line absolute bottom-0 left-0 w-full bg-gray-600 svelte-8az9n8");
			toggle_class(div2, "hidden", ctx.noUnderline || ctx.outlined);
			add_location(div2, file$l, 180, 4, 5277);
			attr(div3, "class", "relative");
			toggle_class(div3, "text-error-500", ctx.error);
			add_location(div3, file$l, 121, 2, 3915);
			attr(div4, "class", "" + ctx.wrapperClasses + " svelte-8az9n8");
			add_location(div4, file$l, 118, 0, 3881);
			dispose = listen(window, "click", ctx.click_handler_3);
		},

		l: function claim(nodes) {
			if (append_slot) append_slot.l(div0_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div3);
			append(div3, label_1);
			append(label_1, t0);
			append(div3, t1);
			append(div3, div0);

			if (append_slot) {
				append_slot.m(div0, null);
			}

			append(div3, t2);
			if (if_block0) if_block0.m(div3, null);
			append(div3, t3);
			if (if_block1) if_block1.m(div3, null);
			append(div3, t4);
			append(div3, div2);
			append(div2, div1);
			append(div4, t5);
			if (if_block2) if_block2.m(div4, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!current || changed.label) {
				set_data(t0, ctx.label);
			}

			if (!current || changed.labelClasses) {
				attr(label_1, "class", "" + ctx.labelClasses + " svelte-8az9n8");
			}

			if (append_slot && append_slot.p && changed.$$scope) {
				append_slot.p(get_slot_changes(append_slot_1, ctx, changed, get_append_slot_changes), get_slot_context(append_slot_1, ctx, get_append_slot_context));
			}

			if ((!current || changed.appendBaseClasses) && div0_class_value !== (div0_class_value = "" + ctx.appendBaseClasses(appendDefault) + " svelte-8az9n8")) {
				attr(div0, "class", div0_class_value);
			}

			if (ctx.append) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_4(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div3, t3);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
				if_block1.p(changed, ctx);
			} else {
				if (if_block1) if_block1.d(1);
				if_block1 = current_block_type && current_block_type(ctx);
				if (if_block1) {
					if_block1.c();
					if_block1.m(div3, t4);
				}
			}

			if ((!current || changed.focused) && div1_class_value !== (div1_class_value = "mx-auto w-0 " + (ctx.focused ? ctx.bg() : "") + " svelte-8az9n8")) {
				attr(div1, "class", div1_class_value);
			}

			if ((changed.focused || changed.bg || changed.focused || changed.error)) {
				toggle_class(div1, "w-full", ctx.focused || ctx.error);
			}

			if ((changed.focused || changed.bg || changed.error)) {
				toggle_class(div1, "bg-error-500", ctx.error);
			}

			if ((changed.noUnderline || changed.outlined)) {
				toggle_class(div2, "hidden", ctx.noUnderline || ctx.outlined);
			}

			if (changed.error) {
				toggle_class(div3, "text-error-500", ctx.error);
			}

			if (ctx.showHint) {
				if (if_block2) {
					if_block2.p(changed, ctx);
					transition_in(if_block2, 1);
				} else {
					if_block2 = create_if_block$b(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div4, null);
				}
			} else if (if_block2) {
				group_outros();
				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});
				check_outros();
			}

			if (!current || changed.wrapperClasses) {
				attr(div4, "class", "" + ctx.wrapperClasses + " svelte-8az9n8");
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(append_slot, local);
			transition_in(if_block0);
			transition_in(if_block2);
			current = true;
		},

		o: function outro(local) {
			transition_out(append_slot, local);
			transition_out(if_block0);
			transition_out(if_block2);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div4);
			}

			if (append_slot) append_slot.d(detaching);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			dispose();
		}
	};
}

let appendDefault = "absolute right-0 top-0 pb-2 pr-4 pt-4 pointer-events-none";

function instance$k($$self, $$props, $$invalidate) {
	

  let { c = "", outlined = false, value = null, label = "", placeholder = "", hint = "", error = false, append = "", persistentHint = false, textarea = false, rows = 5, select = false, autocomplete = false, noUnderline = false, appendReverse = false, color = "primary" } = $$props;


  let labelDefault = `pt-4 absolute top-0 label-transition block pb-2 px-4 pointer-events-none cursor-text`;
  let inputDefault = `transition pb-2 pt-6 px-4 rounded-t text-black w-full`;
  let wrapperDefault = "mt-2 relative pb-6 text-gray-600" + ((select || autocomplete) ? " select" : "");

  let { add = "", remove = "", replace = "" } = $$props;

  const identity = i => i;

  let { inputBaseClasses = identity, labelBaseClasses = identity, wrapperBaseClasses = identity, appendBaseClasses = identity } = $$props;

  const {
    bg,
    border,
    txt,
    caret,
  } = utils(color);

  const l = new ClassBuilder();
  const i = new ClassBuilder();

  let focused = false;
  let labelClasses = "";
  let inputClasses = "";
  let wrapperClasses = "";

  function toggleFocused() {
    $$invalidate('focused', focused = !focused);
  }

	const writable_props = ['c', 'outlined', 'value', 'label', 'placeholder', 'hint', 'error', 'append', 'persistentHint', 'textarea', 'rows', 'select', 'autocomplete', 'noUnderline', 'appendReverse', 'color', 'add', 'remove', 'replace', 'inputBaseClasses', 'labelBaseClasses', 'wrapperBaseClasses', 'appendBaseClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextField> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function blur_handler(event) {
		bubble($$self, event);
	}

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_handler(event) {
		bubble($$self, event);
	}

	function click_handler(event) {
		bubble($$self, event);
	}

	function focus_handler(event) {
		bubble($$self, event);
	}

	function change_handler_1(event) {
		bubble($$self, event);
	}

	function input_handler_1(event) {
		bubble($$self, event);
	}

	function click_handler_1(event) {
		bubble($$self, event);
	}

	function focus_handler_1(event) {
		bubble($$self, event);
	}

	function blur_handler_1(event) {
		bubble($$self, event);
	}

	function change_handler_2(event) {
		bubble($$self, event);
	}

	function input_handler_2(event) {
		bubble($$self, event);
	}

	function click_handler_2(event) {
		bubble($$self, event);
	}

	function blur_handler_2(event) {
		bubble($$self, event);
	}

	function focus_handler_2(event) {
		bubble($$self, event);
	}

	function click_handler_3() {
		const $$result = (select ? (focused = false) : null);
		$$invalidate('focused', focused);
		return $$result;
	}

	function input_input_handler() {
		value = this.value;
		$$invalidate('value', value);
	}

	function textarea_1_input_handler() {
		value = this.value;
		$$invalidate('value', value);
	}

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('outlined' in $$props) $$invalidate('outlined', outlined = $$props.outlined);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('label' in $$props) $$invalidate('label', label = $$props.label);
		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
		if ('hint' in $$props) $$invalidate('hint', hint = $$props.hint);
		if ('error' in $$props) $$invalidate('error', error = $$props.error);
		if ('append' in $$props) $$invalidate('append', append = $$props.append);
		if ('persistentHint' in $$props) $$invalidate('persistentHint', persistentHint = $$props.persistentHint);
		if ('textarea' in $$props) $$invalidate('textarea', textarea = $$props.textarea);
		if ('rows' in $$props) $$invalidate('rows', rows = $$props.rows);
		if ('select' in $$props) $$invalidate('select', select = $$props.select);
		if ('autocomplete' in $$props) $$invalidate('autocomplete', autocomplete = $$props.autocomplete);
		if ('noUnderline' in $$props) $$invalidate('noUnderline', noUnderline = $$props.noUnderline);
		if ('appendReverse' in $$props) $$invalidate('appendReverse', appendReverse = $$props.appendReverse);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('add' in $$props) $$invalidate('add', add = $$props.add);
		if ('remove' in $$props) $$invalidate('remove', remove = $$props.remove);
		if ('replace' in $$props) $$invalidate('replace', replace = $$props.replace);
		if ('inputBaseClasses' in $$props) $$invalidate('inputBaseClasses', inputBaseClasses = $$props.inputBaseClasses);
		if ('labelBaseClasses' in $$props) $$invalidate('labelBaseClasses', labelBaseClasses = $$props.labelBaseClasses);
		if ('wrapperBaseClasses' in $$props) $$invalidate('wrapperBaseClasses', wrapperBaseClasses = $$props.wrapperBaseClasses);
		if ('appendBaseClasses' in $$props) $$invalidate('appendBaseClasses', appendBaseClasses = $$props.appendBaseClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	let showHint, labelOnTop;

	$$self.$$.update = ($$dirty = { error: 1, persistentHint: 1, hint: 1, focused: 1, placeholder: 1, value: 1, labelBaseClasses: 1, labelDefault: 1, labelOnTop: 1, outlined: 1, inputBaseClasses: 1, inputDefault: 1, add: 1, remove: 1, replace: 1, wrapperBaseClasses: 1, wrapperDefault: 1 }) => {
		if ($$dirty.error || $$dirty.persistentHint || $$dirty.hint || $$dirty.focused) { $$invalidate('showHint', showHint = error || (persistentHint ? hint : focused && hint)); }
		if ($$dirty.placeholder || $$dirty.focused || $$dirty.value) { $$invalidate('labelOnTop', labelOnTop = placeholder || focused || value); }
		if ($$dirty.labelBaseClasses || $$dirty.labelDefault || $$dirty.focused || $$dirty.error || $$dirty.labelOnTop || $$dirty.outlined || $$dirty.inputBaseClasses || $$dirty.inputDefault || $$dirty.add || $$dirty.remove || $$dirty.replace || $$dirty.wrapperBaseClasses || $$dirty.wrapperDefault) { {
        $$invalidate('labelClasses', labelClasses = l
          .flush()
          .add(labelBaseClasses(labelDefault))
          .add(txt(), focused && !error)
          .add('label-top text-xs', labelOnTop)
          .remove('pt-4 pb-2 px-4 px-1 pt-0', labelOnTop && outlined)
          .add('ml-3 p-1 pt-0 mt-0 bg-white', labelOnTop && outlined)
          .get());
     
        $$invalidate('inputClasses', inputClasses = i
          .flush()
          .add(inputBaseClasses(inputDefault))
          .remove('pt-6 pb-2', outlined)
          .add('border rounded bg-transparent py-4 transition', outlined)
          .add('border-error-500 caret-error-500', error)
          .add(border(), focused && !error)
          .add('border-gray-600', !error && !focused)
          .add('bg-gray-100', !outlined)
          .add('bg-gray-300', focused && !outlined)
          .add(add)
          .remove(remove)
          .replace(replace)
          .get());
        
        $$invalidate('wrapperClasses', wrapperClasses = (new ClassBuilder())
          .add(wrapperBaseClasses(wrapperDefault))
          .get());
      } }
	};

	return {
		c,
		outlined,
		value,
		label,
		placeholder,
		hint,
		error,
		append,
		persistentHint,
		textarea,
		rows,
		select,
		autocomplete,
		noUnderline,
		appendReverse,
		color,
		add,
		remove,
		replace,
		inputBaseClasses,
		labelBaseClasses,
		wrapperBaseClasses,
		appendBaseClasses,
		bg,
		txt,
		focused,
		labelClasses,
		inputClasses,
		wrapperClasses,
		toggleFocused,
		showHint,
		blur_handler,
		change_handler,
		input_handler,
		click_handler,
		focus_handler,
		change_handler_1,
		input_handler_1,
		click_handler_1,
		focus_handler_1,
		blur_handler_1,
		change_handler_2,
		input_handler_2,
		click_handler_2,
		blur_handler_2,
		focus_handler_2,
		click_handler_3,
		input_input_handler,
		textarea_1_input_handler,
		$$slots,
		$$scope
	};
}

class TextField extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$k, create_fragment$m, safe_not_equal, ["c", "outlined", "value", "label", "placeholder", "hint", "error", "append", "persistentHint", "textarea", "rows", "select", "autocomplete", "noUnderline", "appendReverse", "color", "add", "remove", "replace", "inputBaseClasses", "labelBaseClasses", "wrapperBaseClasses", "appendBaseClasses"]);
	}

	get c() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlined() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlined(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get placeholder() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set placeholder(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hint() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hint(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get error() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set error(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get append() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set append(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get persistentHint() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set persistentHint(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get textarea() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set textarea(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rows() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rows(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get select() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set select(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get autocomplete() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set autocomplete(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noUnderline() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noUnderline(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get appendReverse() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set appendReverse(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get add() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set add(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get remove() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set remove(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get replace() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set replace(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get inputBaseClasses() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set inputBaseClasses(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get labelBaseClasses() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set labelBaseClasses(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperBaseClasses() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperBaseClasses(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get appendBaseClasses() {
		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set appendBaseClasses(value) {
		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Menu\Menu.svelte generated by Svelte v3.6.7 */

const file$m = "node_modules\\smelte\\src\\components\\Menu\\Menu.svelte";

const get_activator_slot_changes = () => ({});
const get_activator_slot_context = () => ({});

// (25:4) {#if open}
function create_if_block$c(ctx) {
	var div, updating_value, current;

	function list_value_binding(value_1) {
		ctx.list_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let list_props = {
		select: true,
		dense: true,
		items: ctx.items,
		c: "list"
	};
	if (ctx.value !== void 0) {
		list_props.value = ctx.value;
	}
	var list = new List({ props: list_props, $$inline: true });

	binding_callbacks.push(() => bind(list, 'value', list_value_binding));
	list.$on("change", ctx.change_handler);

	return {
		c: function create() {
			div = element("div");
			list.$$.fragment.c();
			attr(div, "class", ctx.listWrapperClasses);
			add_location(div, file$m, 25, 6, 790);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(list, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var list_changes = {};
			if (changed.items) list_changes.items = ctx.items;
			if (!updating_value && changed.value) {
				list_changes.value = ctx.value;
			}
			list.$set(list_changes);

			if (!current || changed.listWrapperClasses) {
				attr(div, "class", ctx.listWrapperClasses);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(list.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(list.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(list, );
		}
	};
}

function create_fragment$n(ctx) {
	var div1, div0, t, current, dispose;

	const activator_slot_1 = ctx.$$slots.activator;
	const activator_slot = create_slot(activator_slot_1, ctx, get_activator_slot_context);

	var if_block = (ctx.open) && create_if_block$c(ctx);

	return {
		c: function create() {
			div1 = element("div");
			div0 = element("div");

			if (activator_slot) activator_slot.c();
			t = space();
			if (if_block) if_block.c();

			attr(div0, "class", ctx.wrapperClasses);
			add_location(div0, file$m, 22, 2, 685);
			add_location(div1, file$m, 21, 0, 677);

			dispose = [
				listen(window, "click", ctx.click_handler_1),
				listen(div0, "click", stop_propagation(ctx.click_handler))
			];
		},

		l: function claim(nodes) {
			if (activator_slot) activator_slot.l(div0_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			if (activator_slot) {
				activator_slot.m(div0, null);
			}

			append(div0, t);
			if (if_block) if_block.m(div0, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (activator_slot && activator_slot.p && changed.$$scope) {
				activator_slot.p(get_slot_changes(activator_slot_1, ctx, changed, get_activator_slot_changes), get_slot_context(activator_slot_1, ctx, get_activator_slot_context));
			}

			if (ctx.open) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$c(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div0, null);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if (!current || changed.wrapperClasses) {
				attr(div0, "class", ctx.wrapperClasses);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(activator_slot, local);
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(activator_slot, local);
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (activator_slot) activator_slot.d(detaching);
			if (if_block) if_block.d();
			run_all(dispose);
		}
	};
}

function instance$l($$self, $$props, $$invalidate) {
	

  let { items = [], open = false, value = null, wrapperClasses = "cursor-pointer relative inline-flex", listWrapperClasses = "absolute w-full bottom-0" } = $$props;

  const dispatch = createEventDispatcher();

	const writable_props = ['items', 'open', 'value', 'wrapperClasses', 'listWrapperClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Menu> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	function click_handler_1() {
		const $$result = (open = false);
		$$invalidate('open', open);
		return $$result;
	}

	function list_value_binding(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	function change_handler({ detail }) {
	            dispatch('change', detail);
	            open = false; $$invalidate('open', open);
	          }

	$$self.$set = $$props => {
		if ('items' in $$props) $$invalidate('items', items = $$props.items);
		if ('open' in $$props) $$invalidate('open', open = $$props.open);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('listWrapperClasses' in $$props) $$invalidate('listWrapperClasses', listWrapperClasses = $$props.listWrapperClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		items,
		open,
		value,
		wrapperClasses,
		listWrapperClasses,
		dispatch,
		click_handler,
		click_handler_1,
		list_value_binding,
		change_handler,
		$$slots,
		$$scope
	};
}

class Menu extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$l, create_fragment$n, safe_not_equal, ["items", "open", "value", "wrapperClasses", "listWrapperClasses"]);
	}

	get items() {
		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get open() {
		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set open(value) {
		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get listWrapperClasses() {
		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listWrapperClasses(value) {
		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Checkbox\Checkbox.svelte generated by Svelte v3.6.7 */

const file$n = "node_modules\\smelte\\src\\components\\Checkbox\\Checkbox.svelte";

// (25:6) {:else}
function create_else_block$2(ctx) {
	var current;

	var icon = new Icon({
		props: {
		c: ctx.disabled ? 'text-gray-500' : 'text-gray-600',
		$$slots: { default: [create_default_slot_2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_changes = {};
			if (changed.disabled) icon_changes.c = ctx.disabled ? 'text-gray-500' : 'text-gray-600';
			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
			icon.$set(icon_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};
}

// (23:6) {#if value}
function create_if_block$d(ctx) {
	var current;

	var icon = new Icon({
		props: {
		c: ctx.disabled ? 'text-gray-500' : `text-${ctx.color}-500`,
		$$slots: { default: [create_default_slot_1$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_changes = {};
			if (changed.disabled || changed.color) icon_changes.c = ctx.disabled ? 'text-gray-500' : `text-${ctx.color}-500`;
			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
			icon.$set(icon_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};
}

// (26:8) <Icon c={disabled ? 'text-gray-500' : 'text-gray-600'}>
function create_default_slot_2(ctx) {
	var t;

	return {
		c: function create() {
			t = text("check_box_outline_blank");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (24:8) <Icon c={disabled ? 'text-gray-500' : `text-${color}-500`}>
function create_default_slot_1$3(ctx) {
	var t;

	return {
		c: function create() {
			t = text("check_box");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (22:4) <Ripple color={value && !disabled ? color : 'gray'}>
function create_default_slot$8(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$d,
		create_else_block$2
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.value) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function create_fragment$o(ctx) {
	var div1, input, t0, div0, t1, label_1, t2, div1_class_value, current, dispose;

	var ripple = new Ripple$1({
		props: {
		color: ctx.value && !ctx.disabled ? ctx.color : 'gray',
		$$slots: { default: [create_default_slot$8] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			div1 = element("div");
			input = element("input");
			t0 = space();
			div0 = element("div");
			ripple.$$.fragment.c();
			t1 = space();
			label_1 = element("label");
			t2 = text(ctx.label);
			attr(input, "class", "hidden");
			attr(input, "type", "checkbox");
			add_location(input, file$n, 19, 2, 434);
			attr(div0, "class", "relative w-auto h-auto z-0");
			add_location(div0, file$n, 20, 2, 508);
			attr(label_1, "aria-hidden", "true");
			attr(label_1, "class", "pl-2 cursor-pointer");
			toggle_class(label_1, "text-gray-500", ctx.disabled);
			toggle_class(label_1, "text-gray-700", !ctx.disabled);
			add_location(label_1, file$n, 31, 2, 873);
			attr(div1, "class", div1_class_value = "" + ctx.c + " " + ctx.wrapperClasses);
			add_location(div1, file$n, 18, 0, 380);

			dispose = [
				listen(input, "change", ctx.input_change_handler),
				listen(input, "change", ctx.change_handler),
				listen(div1, "click", ctx.check)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			append(div1, input);

			input.checked = ctx.value;

			append(div1, t0);
			append(div1, div0);
			mount_component(ripple, div0, null);
			append(div1, t1);
			append(div1, label_1);
			append(label_1, t2);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.value) input.checked = ctx.value;

			var ripple_changes = {};
			if (changed.value || changed.disabled || changed.color) ripple_changes.color = ctx.value && !ctx.disabled ? ctx.color : 'gray';
			if (changed.$$scope || changed.value || changed.disabled || changed.color) ripple_changes.$$scope = { changed, ctx };
			ripple.$set(ripple_changes);

			if (!current || changed.label) {
				set_data(t2, ctx.label);
			}

			if (changed.disabled) {
				toggle_class(label_1, "text-gray-500", ctx.disabled);
				toggle_class(label_1, "text-gray-700", !ctx.disabled);
			}

			if ((!current || changed.c || changed.wrapperClasses) && div1_class_value !== (div1_class_value = "" + ctx.c + " " + ctx.wrapperClasses)) {
				attr(div1, "class", div1_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(ripple.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(ripple.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_component(ripple, );

			run_all(dispose);
		}
	};
}

function instance$m($$self, $$props, $$invalidate) {
	

  let { c = "", value = false, label = "", color = "primary", disabled = false, wrapperClasses = "inline-flex items-center mb-2 cursor-pointer z-10" } = $$props;

  function check() {
    if (disabled) return;

    $$invalidate('value', value = !value);
  }

	const writable_props = ['c', 'value', 'label', 'color', 'disabled', 'wrapperClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Checkbox> was created with unknown prop '${key}'`);
	});

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_change_handler() {
		value = this.checked;
		$$invalidate('value', value);
	}

	$$self.$set = $$props => {
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('label' in $$props) $$invalidate('label', label = $$props.label);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
	};

	return {
		c,
		value,
		label,
		color,
		disabled,
		wrapperClasses,
		check,
		change_handler,
		input_change_handler
	};
}

class Checkbox extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$m, create_fragment$o, safe_not_equal, ["c", "value", "label", "color", "disabled", "wrapperClasses"]);
	}

	get c() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\RadioButton\RadioButton.svelte generated by Svelte v3.6.7 */

const file$o = "node_modules\\smelte\\src\\components\\RadioButton\\RadioButton.svelte";

// (34:4) {:else}
function create_else_block$3(ctx) {
	var current;

	var icon = new Icon({
		props: {
		c: ctx.disabled ? 'text-gray-500' : 'text-gray-600',
		$$slots: { default: [create_default_slot_2$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_changes = {};
			if (changed.disabled) icon_changes.c = ctx.disabled ? 'text-gray-500' : 'text-gray-600';
			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
			icon.$set(icon_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};
}

// (30:4) {#if selected === value}
function create_if_block$e(ctx) {
	var current;

	var icon = new Icon({
		props: {
		c: "text-" + (ctx.disabled ? 'gray' : ctx.color) + "-500",
		$$slots: { default: [create_default_slot_1$4] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			icon.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_changes = {};
			if (changed.disabled || changed.color) icon_changes.c = "text-" + (ctx.disabled ? 'gray' : ctx.color) + "-500";
			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
			icon.$set(icon_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};
}

// (35:6) <Icon c={disabled ? 'text-gray-500' : 'text-gray-600'}>
function create_default_slot_2$1(ctx) {
	var t;

	return {
		c: function create() {
			t = text("radio_button_unchecked");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (31:6) <Icon c="text-{disabled ? 'gray' : color}-500">
function create_default_slot_1$4(ctx) {
	var t;

	return {
		c: function create() {
			t = text("radio_button_checked");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (29:2) <Ripple color={value && !disabled ? color : 'gray'}>
function create_default_slot$9(ctx) {
	var current_block_type_index, if_block, if_block_anchor, current;

	var if_block_creators = [
		create_if_block$e,
		create_else_block$3
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.selected === ctx.value) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},

		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function create_fragment$p(ctx) {
	var div, input, input_selected_value, t0, t1, label_1, t2, current, dispose;

	var ripple = new Ripple$1({
		props: {
		color: ctx.value && !ctx.disabled ? ctx.color : 'gray',
		$$slots: { default: [create_default_slot$9] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			input = element("input");
			t0 = space();
			ripple.$$.fragment.c();
			t1 = space();
			label_1 = element("label");
			t2 = text(ctx.label);
			attr(input, "aria-label", ctx.label);
			attr(input, "class", "hidden");
			attr(input, "type", "radio");
			attr(input, "role", "radio");
			attr(input, "selected", input_selected_value = ctx.selected === ctx.value);
			add_location(input, file$o, 22, 2, 469);
			attr(label_1, "aria-hidden", "true");
			attr(label_1, "class", "pl-2");
			toggle_class(label_1, "text-gray-500", ctx.disabled);
			toggle_class(label_1, "text-gray-700", !ctx.disabled);
			add_location(label_1, file$o, 39, 2, 913);
			attr(div, "class", ctx.wrapperClasses);
			add_location(div, file$o, 19, 0, 416);
			dispose = listen(div, "click", ctx.select);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, input);
			append(div, t0);
			mount_component(ripple, div, null);
			append(div, t1);
			append(div, label_1);
			append(label_1, t2);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!current || changed.label) {
				attr(input, "aria-label", ctx.label);
			}

			if ((!current || changed.selected || changed.value) && input_selected_value !== (input_selected_value = ctx.selected === ctx.value)) {
				attr(input, "selected", input_selected_value);
			}

			var ripple_changes = {};
			if (changed.value || changed.disabled || changed.color) ripple_changes.color = ctx.value && !ctx.disabled ? ctx.color : 'gray';
			if (changed.$$scope || changed.selected || changed.value || changed.disabled || changed.color) ripple_changes.$$scope = { changed, ctx };
			ripple.$set(ripple_changes);

			if (!current || changed.label) {
				set_data(t2, ctx.label);
			}

			if (changed.disabled) {
				toggle_class(label_1, "text-gray-500", ctx.disabled);
				toggle_class(label_1, "text-gray-700", !ctx.disabled);
			}

			if (!current || changed.wrapperClasses) {
				attr(div, "class", ctx.wrapperClasses);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(ripple.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(ripple.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(ripple, );

			dispose();
		}
	};
}

function instance$n($$self, $$props, $$invalidate) {
	

  let { selected = "", label = "", color = "primary", disabled = false, name = "", value = "", wrapperClasses = "inline-flex block items-center mb-2 cursor-pointer z-0" } = $$props;

  function select() {
    if (disabled) return;

    $$invalidate('selected', selected = value);
  }

	const writable_props = ['selected', 'label', 'color', 'disabled', 'name', 'value', 'wrapperClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RadioButton> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('label' in $$props) $$invalidate('label', label = $$props.label);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('name' in $$props) $$invalidate('name', name = $$props.name);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
	};

	return {
		selected,
		label,
		color,
		disabled,
		name,
		value,
		wrapperClasses,
		select
	};
}

class RadioButton extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$n, create_fragment$p, safe_not_equal, ["selected", "label", "color", "disabled", "name", "value", "wrapperClasses"]);
	}

	get selected() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get name() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set name(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<RadioButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<RadioButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\RadioButton\RadioButtonGroup.svelte generated by Svelte v3.6.7 */

const file$p = "node_modules\\smelte\\src\\components\\RadioButton\\RadioButtonGroup.svelte";

const get_default_slot_changes = ({ item, items }) => ({ item: items });
const get_default_slot_context = ({ item, items }) => ({ item: item });

function get_each_context$2(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.item = list[i];
	return child_ctx;
}

// (14:2) {#each items as item}
function create_each_block$2(ctx) {
	var updating_selected, t, current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, get_default_slot_context);

	var radiobutton_spread_levels = [
		{ wrapperClasses: ctx.buttonClasses },
		ctx.item,
		{ color: ctx.color },
		{ name: ctx.name || `radio-${Math.random()}` },
		{ disabled: ctx.disabled }
	];

	function radiobutton_selected_binding(value) {
		ctx.radiobutton_selected_binding.call(null, value);
		updating_selected = true;
		add_flush_callback(() => updating_selected = false);
	}

	let radiobutton_props = {};
	for (var i = 0; i < radiobutton_spread_levels.length; i += 1) {
		radiobutton_props = assign(radiobutton_props, radiobutton_spread_levels[i]);
	}
	if (ctx.selected !== void 0) {
		radiobutton_props.selected = ctx.selected;
	}
	var radiobutton = new RadioButton({ props: radiobutton_props, $$inline: true });

	binding_callbacks.push(() => bind(radiobutton, 'selected', radiobutton_selected_binding));

	return {
		c: function create() {
			if (!default_slot) {
				radiobutton.$$.fragment.c();
				t = space();
			}

			if (default_slot) default_slot.c();
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!default_slot) {
				mount_component(radiobutton, target, anchor);
				insert(target, t, anchor);
			}

			else {
				default_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!default_slot) {
				var radiobutton_changes = (changed.buttonClasses || changed.items || changed.color || changed.name || changed.disabled) ? get_spread_update(radiobutton_spread_levels, [
					(changed.buttonClasses) && { wrapperClasses: ctx.buttonClasses },
					(changed.items) && ctx.item,
					(changed.color) && { color: ctx.color },
					(changed.name) && { name: ctx.name || `radio-${Math.random()}` },
					(changed.disabled) && { disabled: ctx.disabled }
				]) : {};
				if (!updating_selected && changed.selected) {
					radiobutton_changes.selected = ctx.selected;
				}
				radiobutton.$set(radiobutton_changes);
			}

			if (default_slot && default_slot.p && (changed.$$scope || changed.items)) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, get_default_slot_changes), get_slot_context(default_slot_1, ctx, get_default_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(radiobutton.$$.fragment, local);

			transition_in(default_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(radiobutton.$$.fragment, local);
			transition_out(default_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!default_slot) {
				destroy_component(radiobutton, detaching);

				if (detaching) {
					detach(t);
				}
			}

			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$q(ctx) {
	var div, current;

	var each_value = ctx.items;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c: function create() {
			div = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr(div, "class", ctx.wrapperClasses);
			add_location(div, file$p, 12, 0, 365);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.buttonClasses || changed.items || changed.color || changed.name || changed.disabled || changed.selected || changed.$$scope) {
				each_value = ctx.items;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}

			if (!current || changed.wrapperClasses) {
				attr(div, "class", ctx.wrapperClasses);
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$o($$self, $$props, $$invalidate) {
	let { items = [], selected = "", name = "", disabled = false, color = "primary", wrapperClasses = "flex flex-col mb-4 cursor-pointer", buttonClasses = "inline-flex block items-center mb-2 cursor-pointer z-0" } = $$props;

	const writable_props = ['items', 'selected', 'name', 'disabled', 'color', 'wrapperClasses', 'buttonClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<RadioButtonGroup> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function radiobutton_selected_binding(value) {
		selected = value;
		$$invalidate('selected', selected);
	}

	$$self.$set = $$props => {
		if ('items' in $$props) $$invalidate('items', items = $$props.items);
		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
		if ('name' in $$props) $$invalidate('name', name = $$props.name);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('buttonClasses' in $$props) $$invalidate('buttonClasses', buttonClasses = $$props.buttonClasses);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		items,
		selected,
		name,
		disabled,
		color,
		wrapperClasses,
		buttonClasses,
		radiobutton_selected_binding,
		$$slots,
		$$scope
	};
}

class RadioButtonGroup extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$o, create_fragment$q, safe_not_equal, ["items", "selected", "name", "disabled", "color", "wrapperClasses", "buttonClasses"]);
	}

	get items() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selected() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get name() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set name(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get buttonClasses() {
		throw new Error("<RadioButtonGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set buttonClasses(value) {
		throw new Error("<RadioButtonGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Select\Select.svelte generated by Svelte v3.6.7 */

const file$q = "node_modules\\smelte\\src\\components\\Select\\Select.svelte";

const get_options_slot_changes = () => ({});
const get_options_slot_context = () => ({});

const get_select_slot_changes = () => ({});
const get_select_slot_context = () => ({});

// (99:2) {#if showList}
function create_if_block$f(ctx) {
	var div, updating_value, div_intro, div_outro, dispose_options_slot, current;

	const options_slot_1 = ctx.$$slots.options;
	const options_slot = create_slot(options_slot_1, ctx, get_options_slot_context);

	function list_value_binding(value_1) {
		ctx.list_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let list_props = { select: true, items: ctx.filteredItems };
	if (ctx.value !== void 0) {
		list_props.value = ctx.value;
	}
	var list = new List({ props: list_props, $$inline: true });

	binding_callbacks.push(() => bind(list, 'value', list_value_binding));
	list.$on("change", ctx.change_handler);

	return {
		c: function create() {
			if (!options_slot) {
				div = element("div");
				list.$$.fragment.c();
			}

			if (options_slot) options_slot.c();
			if (!options_slot) {
				attr(div, "class", "list");
				toggle_class(div, "rounded-t-none", !ctx.outlined);
				add_location(div, file$q, 100, 6, 2350);
				dispose_options_slot = listen(div, "click", ctx.click_handler_3);
			}
		},

		l: function claim(nodes) {
			if (options_slot) options_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!options_slot) {
				insert(target, div, anchor);
				mount_component(list, div, null);
			}

			else {
				options_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (!options_slot) {
				var list_changes = {};
				if (changed.filteredItems) list_changes.items = ctx.filteredItems;
				if (!updating_value && changed.value) {
					list_changes.value = ctx.value;
				}
				list.$set(list_changes);

				if (changed.outlined) {
					toggle_class(div, "rounded-t-none", !ctx.outlined);
				}
			}

			if (options_slot && options_slot.p && changed.$$scope) {
				options_slot.p(get_slot_changes(options_slot_1, ctx, changed, get_options_slot_changes), get_slot_context(options_slot_1, ctx, get_options_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(list.$$.fragment, local);

			add_render_callback(() => {
				if (div_outro) div_outro.end(1);
				if (!div_intro) div_intro = create_in_transition(div, fly, ctx.inProps);
				div_intro.start();
			});

			transition_in(options_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(list.$$.fragment, local);
			if (div_intro) div_intro.invalidate();

			div_outro = create_out_transition(div, fly, ctx.outProps);

			transition_out(options_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!options_slot) {
				if (detaching) {
					detach(div);
				}

				destroy_component(list, );

				if (detaching) {
					if (div_outro) div_outro.end();
				}

				dispose_options_slot();
			}

			if (options_slot) options_slot.d(detaching);
		}
	};
}

function create_fragment$r(ctx) {
	var div, t, div_class_value, current, dispose;

	const select_slot_1 = ctx.$$slots.select;
	const select_slot = create_slot(select_slot_1, ctx, get_select_slot_context);

	var textfield_spread_levels = [
		{ select: true },
		{ autocomplete: ctx.autocomplete },
		{ value: ctx.selectedLabel },
		ctx.props,
		{ append: "arrow_drop_down" },
		{ appendReverse: ctx.showList }
	];

	let textfield_props = {};
	for (var i = 0; i < textfield_spread_levels.length; i += 1) {
		textfield_props = assign(textfield_props, textfield_spread_levels[i]);
	}
	var textfield = new TextField({ props: textfield_props, $$inline: true });
	textfield.$on("click", ctx.click_handler_2);
	textfield.$on("click", ctx.click_handler);
	textfield.$on("input", ctx.filterItems);

	var if_block = (ctx.showList) && create_if_block$f(ctx);

	return {
		c: function create() {
			div = element("div");

			if (!select_slot) {
				textfield.$$.fragment.c();
			}

			if (select_slot) select_slot.c();
			t = space();
			if (if_block) if_block.c();

			attr(div, "class", div_class_value = "" + ctx.wrapperClasses + " " + ctx.c);
			add_location(div, file$q, 80, 0, 1939);
			dispose = listen(window, "click", ctx.click_handler_1);
		},

		l: function claim(nodes) {
			if (select_slot) select_slot.l(div_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			if (!select_slot) {
				mount_component(textfield, div, null);
			}

			else {
				select_slot.m(div, null);
			}

			append(div, t);
			if (if_block) if_block.m(div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!select_slot) {
				var textfield_changes = (changed.autocomplete || changed.selectedLabel || changed.props || changed.showList) ? get_spread_update(textfield_spread_levels, [
					{ select: true },
					(changed.autocomplete) && { autocomplete: ctx.autocomplete },
					(changed.selectedLabel) && { value: ctx.selectedLabel },
					(changed.props) && ctx.props,
					{ append: "arrow_drop_down" },
					(changed.showList) && { appendReverse: ctx.showList }
				]) : {};
				textfield.$set(textfield_changes);
			}

			if (select_slot && select_slot.p && changed.$$scope) {
				select_slot.p(get_slot_changes(select_slot_1, ctx, changed, get_select_slot_changes), get_slot_context(select_slot_1, ctx, get_select_slot_context));
			}

			if (ctx.showList) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$f(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if ((!current || changed.wrapperClasses || changed.c) && div_class_value !== (div_class_value = "" + ctx.wrapperClasses + " " + ctx.c)) {
				attr(div, "class", div_class_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(textfield.$$.fragment, local);

			transition_in(select_slot, local);
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(textfield.$$.fragment, local);
			transition_out(select_slot, local);
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (!select_slot) {
				destroy_component(textfield, );
			}

			if (select_slot) select_slot.d(detaching);
			if (if_block) if_block.d();
			dispose();
		}
	};
}

function process(it) {
  return it.map(i => typeof i !== 'object'
   ? ({ value: i, text: i })
   : i);
}

function instance$p($$self, $$props, $$invalidate) {
	

  let { items = [], c = "", value = "", text = "", label = "", color = "primary", outlined = false, placeholder = "", hint = "", error = false, append = "", persistentHint = false, autocomplete = false, noUnderline = false, wrapperClasses = "cursor-pointer relative pb-4", wrapperBaseClasses = i => i } = $$props;
  let { appendBaseClasses = i => i } = $$props;

  let { add = "", remove = "", replace = "" } = $$props;

  let showList = false;
  let filteredItems = items;
  let itemsProcessed = [];
  let selectedLabel = '';

  const props = {
    outlined,
    label,
    placeholder,
    hint,
    error,
    append,
    persistentHint,
    color,
    add,
    remove,
    replace,
    noUnderline,
    wrapperBaseClasses,
    appendBaseClasses,
  };
  
  onMount(() => {
    $$invalidate('selectedLabel', selectedLabel = getLabel(value));
  });

  const inProps = { y: 10, duration: 50, easing: quadIn };
  const outProps = { y: -10, duration: 100, easing: quadOut, delay: 50 };
  const dispatch = createEventDispatcher();

  function getLabel(value) {
    return value ? (itemsProcessed.find(i => i.value === value) || {}).text : "";
  }

  function filterItems({ target }) {
    $$invalidate('filteredItems', filteredItems = itemsProcessed.filter(i =>
      i.text.toLowerCase().includes(target.value.toLowerCase())
    ));
  }

	const writable_props = ['items', 'c', 'value', 'text', 'label', 'color', 'outlined', 'placeholder', 'hint', 'error', 'append', 'persistentHint', 'autocomplete', 'noUnderline', 'wrapperClasses', 'wrapperBaseClasses', 'appendBaseClasses', 'add', 'remove', 'replace'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Select> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	function click_handler_1() {
		const $$result = (showList = false);
		$$invalidate('showList', showList);
		return $$result;
	}

	function click_handler_2(e) {
	        e.stopPropagation();
	        showList = true; $$invalidate('showList', showList);
	      }

	function list_value_binding(value_1) {
		value = value_1;
		$$invalidate('value', value);
	}

	function change_handler({ detail }) {
	            selectedLabel = getLabel(detail); $$invalidate('selectedLabel', selectedLabel);
	            dispatch('change', detail);
	          }

	function click_handler_3() {
		const $$result = (showList = false);
		$$invalidate('showList', showList);
		return $$result;
	}

	$$self.$set = $$props => {
		if ('items' in $$props) $$invalidate('items', items = $$props.items);
		if ('c' in $$props) $$invalidate('c', c = $$props.c);
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('text' in $$props) $$invalidate('text', text = $$props.text);
		if ('label' in $$props) $$invalidate('label', label = $$props.label);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('outlined' in $$props) $$invalidate('outlined', outlined = $$props.outlined);
		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
		if ('hint' in $$props) $$invalidate('hint', hint = $$props.hint);
		if ('error' in $$props) $$invalidate('error', error = $$props.error);
		if ('append' in $$props) $$invalidate('append', append = $$props.append);
		if ('persistentHint' in $$props) $$invalidate('persistentHint', persistentHint = $$props.persistentHint);
		if ('autocomplete' in $$props) $$invalidate('autocomplete', autocomplete = $$props.autocomplete);
		if ('noUnderline' in $$props) $$invalidate('noUnderline', noUnderline = $$props.noUnderline);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('wrapperBaseClasses' in $$props) $$invalidate('wrapperBaseClasses', wrapperBaseClasses = $$props.wrapperBaseClasses);
		if ('appendBaseClasses' in $$props) $$invalidate('appendBaseClasses', appendBaseClasses = $$props.appendBaseClasses);
		if ('add' in $$props) $$invalidate('add', add = $$props.add);
		if ('remove' in $$props) $$invalidate('remove', remove = $$props.remove);
		if ('replace' in $$props) $$invalidate('replace', replace = $$props.replace);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	$$self.$$.update = ($$dirty = { items: 1 }) => {
		if ($$dirty.items) { itemsProcessed = process(items); }
	};

	return {
		items,
		c,
		value,
		text,
		label,
		color,
		outlined,
		placeholder,
		hint,
		error,
		append,
		persistentHint,
		autocomplete,
		noUnderline,
		wrapperClasses,
		wrapperBaseClasses,
		appendBaseClasses,
		add,
		remove,
		replace,
		showList,
		filteredItems,
		selectedLabel,
		props,
		inProps,
		outProps,
		dispatch,
		getLabel,
		filterItems,
		click_handler,
		click_handler_1,
		click_handler_2,
		list_value_binding,
		change_handler,
		click_handler_3,
		$$slots,
		$$scope
	};
}

class Select extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$p, create_fragment$r, safe_not_equal, ["items", "c", "value", "text", "label", "color", "outlined", "placeholder", "hint", "error", "append", "persistentHint", "autocomplete", "noUnderline", "wrapperClasses", "wrapperBaseClasses", "appendBaseClasses", "add", "remove", "replace"]);
	}

	get items() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set items(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get c() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set c(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get text() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set text(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlined() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlined(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get placeholder() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set placeholder(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hint() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hint(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get error() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set error(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get append() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set append(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get persistentHint() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set persistentHint(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get autocomplete() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set autocomplete(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noUnderline() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noUnderline(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperBaseClasses() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperBaseClasses(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get appendBaseClasses() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set appendBaseClasses(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get add() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set add(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get remove() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set remove(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get replace() {
		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set replace(value) {
		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\ProgressCircular\ProgressCircular.svelte generated by Svelte v3.6.7 */

const file$r = "node_modules\\smelte\\src\\components\\ProgressCircular\\ProgressCircular.svelte";

function create_fragment$s(ctx) {
	var svg, circle, circle_class_value, circle_style_value;

	return {
		c: function create() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "class", circle_class_value = "path stroke-" + ctx.color + " svelte-1f5t7ob");
			attr(circle, "cx", "35");
			attr(circle, "cy", "35");
			attr(circle, "r", "20");
			attr(circle, "fill", "none");
			attr(circle, "stroke-width", ctx.width);
			attr(circle, "stroke-miterlimit", "10");
			attr(circle, "style", circle_style_value = "" + (ctx.progress > 0 ? `
        animation: none;
        stroke-dasharray: ${150000 - ctx.progress * 1000};
        stroke-dashoffset: -${124 - (ctx.progress * 124) / 100};
      ` : '') + ";");
			add_location(circle, file$r, 75, 2, 3188);
			attr(svg, "class", "circular svelte-1f5t7ob");
			add_location(svg, file$r, 74, 0, 3163);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},

		p: function update(changed, ctx) {
			if ((changed.color) && circle_class_value !== (circle_class_value = "path stroke-" + ctx.color + " svelte-1f5t7ob")) {
				attr(circle, "class", circle_class_value);
			}

			if (changed.width) {
				attr(circle, "stroke-width", ctx.width);
			}

			if ((changed.progress) && circle_style_value !== (circle_style_value = "" + (ctx.progress > 0 ? `
        animation: none;
        stroke-dasharray: ${150000 - ctx.progress * 1000};
        stroke-dashoffset: -${124 - (ctx.progress * 124) / 100};
      ` : '') + ";")) {
				attr(circle, "style", circle_style_value);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

function instance$q($$self, $$props, $$invalidate) {
	let { progress = null, color = "primary", width = 3 } = $$props;

	const writable_props = ['progress', 'color', 'width'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ProgressCircular> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('progress' in $$props) $$invalidate('progress', progress = $$props.progress);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('width' in $$props) $$invalidate('width', width = $$props.width);
	};

	return { progress, color, width };
}

class ProgressCircular extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$q, create_fragment$s, safe_not_equal, ["progress", "color", "width"]);
	}

	get progress() {
		throw new Error("<ProgressCircular>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set progress(value) {
		throw new Error("<ProgressCircular>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<ProgressCircular>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<ProgressCircular>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get width() {
		throw new Error("<ProgressCircular>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<ProgressCircular>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Slider\Slider.svelte generated by Svelte v3.6.7 */

const file$s = "node_modules\\smelte\\src\\components\\Slider\\Slider.svelte";

function create_fragment$t(ctx) {
	var label_1, t0, t1, input, dispose;

	return {
		c: function create() {
			label_1 = element("label");
			t0 = text(ctx.label);
			t1 = space();
			input = element("input");
			attr(label_1, "class", "label");
			add_location(label_1, file$s, 130, 0, 5277);
			attr(input, "type", "range");
			attr(input, "min", ctx.min);
			attr(input, "max", ctx.max);
			attr(input, "step", ctx.step);
			input.disabled = ctx.disabled;
			attr(input, "style", ctx.style);
			attr(input, "class", "svelte-q0fr3i");
			toggle_class(input, "disabled", ctx.disabled);
			add_location(input, file$s, 131, 0, 5314);

			dispose = [
				listen(input, "change", ctx.input_change_input_handler),
				listen(input, "input", ctx.input_change_input_handler),
				listen(input, "change", ctx.change_handler)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, label_1, anchor);
			append(label_1, t0);
			insert(target, t1, anchor);
			insert(target, input, anchor);

			input.value = ctx.value;
		},

		p: function update(changed, ctx) {
			if (changed.label) {
				set_data(t0, ctx.label);
			}

			if (changed.value) input.value = ctx.value;

			if (changed.min) {
				attr(input, "min", ctx.min);
			}

			if (changed.max) {
				attr(input, "max", ctx.max);
			}

			if (changed.step) {
				attr(input, "step", ctx.step);
			}

			if (changed.disabled) {
				input.disabled = ctx.disabled;
			}

			if (changed.style) {
				attr(input, "style", ctx.style);
			}

			if (changed.disabled) {
				toggle_class(input, "disabled", ctx.disabled);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(label_1);
				detach(t1);
				detach(input);
			}

			run_all(dispose);
		}
	};
}

function instance$r($$self, $$props, $$invalidate) {
	let { value = 0, label = "", color = "primary", disabled = false, min = 0, max = 100, step = null } = $$props;

	const writable_props = ['value', 'label', 'color', 'disabled', 'min', 'max', 'step'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Slider> was created with unknown prop '${key}'`);
	});

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_change_input_handler() {
		value = to_number(this.value);
		$$invalidate('value', value);
	}

	$$self.$set = $$props => {
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('label' in $$props) $$invalidate('label', label = $$props.label);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('min' in $$props) $$invalidate('min', min = $$props.min);
		if ('max' in $$props) $$invalidate('max', max = $$props.max);
		if ('step' in $$props) $$invalidate('step', step = $$props.step);
	};

	let style;

	$$self.$$.update = ($$dirty = { disabled: 1, value: 1 }) => {
		if ($$dirty.disabled || $$dirty.value) { $$invalidate('style', style = disabled
        ? ''
        : `background: linear-gradient(to right, #bc47bc 0%, #bc47bc ${value}%, #f6e5f6 ${value}%, #f6e5f6 100%)`); }
	};

	return {
		value,
		label,
		color,
		disabled,
		min,
		max,
		step,
		style,
		change_handler,
		input_change_input_handler
	};
}

class Slider extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$r, create_fragment$t, safe_not_equal, ["value", "label", "color", "disabled", "min", "max", "step"]);
	}

	get value() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get min() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set min(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get max() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set max(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get step() {
		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set step(value) {
		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Snackbar\Snackbar.svelte generated by Svelte v3.6.7 */

const file$t = "node_modules\\smelte\\src\\components\\Snackbar\\Snackbar.svelte";

const get_action_slot_changes = () => ({});
const get_action_slot_context = () => ({});

// (31:0) {#if value}
function create_if_block$g(ctx) {
	var div1, div0, t0, t1, div0_intro, div0_outro, current;

	const default_slot_1 = ctx.$$slots.default;
	const default_slot = create_slot(default_slot_1, ctx, null);

	var spacer = new Spacer$1({ $$inline: true });

	const action_slot_1 = ctx.$$slots.action;
	const action_slot = create_slot(action_slot_1, ctx, get_action_slot_context);

	return {
		c: function create() {
			div1 = element("div");
			div0 = element("div");

			if (default_slot) default_slot.c();
			t0 = space();
			spacer.$$.fragment.c();
			t1 = space();

			if (action_slot) action_slot.c();

			attr(div0, "class", "" + ctx.classes + " svelte-13xxut4");
			add_location(div0, file$t, 32, 4, 1241);
			attr(div1, "class", "fixed bottom-0 left-0 w-full flex items-center justify-center");
			add_location(div1, file$t, 31, 2, 1161);
		},

		l: function claim(nodes) {
			if (default_slot) default_slot.l(div0_nodes);

			if (action_slot) action_slot.l(div0_nodes);
		},

		m: function mount(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			append(div0, t0);
			mount_component(spacer, div0, null);
			append(div0, t1);

			if (action_slot) {
				action_slot.m(div0, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			if (default_slot && default_slot.p && changed.$$scope) {
				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
			}

			if (action_slot && action_slot.p && changed.$$scope) {
				action_slot.p(get_slot_changes(action_slot_1, ctx, changed, get_action_slot_changes), get_slot_context(action_slot_1, ctx, get_action_slot_context));
			}

			if (!current || changed.classes) {
				attr(div0, "class", "" + ctx.classes + " svelte-13xxut4");
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);

			transition_in(spacer.$$.fragment, local);

			transition_in(action_slot, local);

			add_render_callback(() => {
				if (div0_outro) div0_outro.end(1);
				if (!div0_intro) div0_intro = create_in_transition(div0, fade, ctx.inProps);
				div0_intro.start();
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(default_slot, local);
			transition_out(spacer.$$.fragment, local);
			transition_out(action_slot, local);
			if (div0_intro) div0_intro.invalidate();

			div0_outro = create_out_transition(div0, fade, ctx.outProps);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (default_slot) default_slot.d(detaching);

			destroy_component(spacer, );

			if (action_slot) action_slot.d(detaching);

			if (detaching) {
				if (div0_outro) div0_outro.end();
			}
		}
	};
}

function create_fragment$u(ctx) {
	var if_block_anchor, current;

	var if_block = (ctx.value) && create_if_block$g(ctx);

	return {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.value) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$g(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function instance$s($$self, $$props, $$invalidate) {
	

  let { value = false, timeout = 4000, classes = `flex absolute bottom-0 py-2 px-4 z-30 mb-4 content-between mx-auto
      rounded items-center bg-gray-800 text-white snackbar elevation-2` } = $$props;

  onMount(() => {
    if ( !timeout) return;

    setTimeout(() => {
      $$invalidate('value', value = false);
    }, timeout);
  });

  const inProps = { duration: 100, easing: quadIn };
  const outProps = { duration: 200, easing: quadOut, delay: 200 };

	const writable_props = ['value', 'timeout', 'classes'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Snackbar> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('timeout' in $$props) $$invalidate('timeout', timeout = $$props.timeout);
		if ('classes' in $$props) $$invalidate('classes', classes = $$props.classes);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	return {
		value,
		timeout,
		classes,
		inProps,
		outProps,
		$$slots,
		$$scope
	};
}

class Snackbar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$s, create_fragment$u, safe_not_equal, ["value", "timeout", "classes"]);
	}

	get value() {
		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get timeout() {
		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set timeout(value) {
		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get classes() {
		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set classes(value) {
		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function sort(data, col, asc) {
  if (!col) return data;

  if (col.sort) return col.sort(data);

  const sorted = data.sort((a, b) => {
    const valA = col.value ? col.value(a) : a[col.field];
    const valB = col.value ? col.value(b) : b[col.field];

    const first = asc ? valA : valB;
    const second = asc ? valB : valA;

    if (typeof valA === "number") {
      return first - second;
    }

    return ("" + first).localeCompare(second);
  });

  return sorted;
}

/* node_modules\smelte\src\components\DataTable\DataTable.svelte generated by Svelte v3.6.7 */
const { Object: Object_1 } = globals;

const file$u = "node_modules\\smelte\\src\\components\\DataTable\\DataTable.svelte";

const get_footer_slot_changes = () => ({});
const get_footer_slot_context = () => ({});

const get_pagination_slot_changes = () => ({});
const get_pagination_slot_context = () => ({});

const get_edit_dialog_slot_changes = () => ({});
const get_edit_dialog_slot_context = () => ({});

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.column = list[i];
	child_ctx.i = i;
	return child_ctx;
}

const get_item_slot_changes$2 = () => ({});
const get_item_slot_context$2 = () => ({});

function get_each_context$3(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.item = list[i];
	child_ctx.j = i;
	return child_ctx;
}

const get_header_slot_changes = () => ({});
const get_header_slot_context = () => ({});

function get_each_context_2(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.column = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (142:12) {#if column.sortable !== false}
function create_if_block_3$1(ctx) {
	var span, current;

	var icon = new Icon({
		props: {
		small: true,
		color: "text-gray-400",
		$$slots: { default: [create_default_slot$a] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			span = element("span");
			icon.$$.fragment.c();
			attr(span, "class", "sort svelte-1v2xm10");
			toggle_class(span, "asc", !ctx.asc && ctx.sortBy === ctx.column);
			add_location(span, file$u, 142, 14, 5276);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			mount_component(icon, span, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var icon_changes = {};
			if (changed.$$scope) icon_changes.$$scope = { changed, ctx };
			icon.$set(icon_changes);

			if ((changed.asc || changed.sortBy || changed.columns)) {
				toggle_class(span, "asc", !ctx.asc && ctx.sortBy === ctx.column);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}

			destroy_component(icon, );
		}
	};
}

// (144:16) <Icon small color="text-gray-400">
function create_default_slot$a(ctx) {
	var t;

	return {
		c: function create() {
			t = text("arrow_downward");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (128:4) {#each columns as column, i}
function create_each_block_2(ctx) {
	var th, div, t0, span, t1_value = ctx.column.label || ctx.column.field, t1, t2, dispose_header_slot, current;

	const header_slot_1 = ctx.$$slots.header;
	const header_slot = create_slot(header_slot_1, ctx, get_header_slot_context);

	var if_block = (ctx.column.sortable !== false) && create_if_block_3$1(ctx);

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	return {
		c: function create() {
			if (!header_slot) {
				th = element("th");
				div = element("div");
				if (if_block) if_block.c();
				t0 = space();
				span = element("span");
				t1 = text(t1_value);
				t2 = space();
			}

			if (header_slot) header_slot.c();
			if (!header_slot) {
				add_location(span, file$u, 146, 12, 5458);
				attr(div, "class", "sort-wrapper svelte-1v2xm10");
				add_location(div, file$u, 140, 10, 5191);
				attr(th, "class", "capitalize svelte-1v2xm10");
				add_location(th, file$u, 129, 8, 4897);
				dispose_header_slot = listen(th, "click", click_handler);
			}
		},

		l: function claim(nodes) {
			if (header_slot) header_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!header_slot) {
				insert(target, th, anchor);
				append(th, div);
				if (if_block) if_block.m(div, null);
				append(div, t0);
				append(div, span);
				append(span, t1);
				insert(target, t2, anchor);
			}

			else {
				header_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if (!header_slot) {
				if (ctx.column.sortable !== false) {
					if (if_block) {
						if_block.p(changed, ctx);
						transition_in(if_block, 1);
					} else {
						if_block = create_if_block_3$1(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div, t0);
					}
				} else if (if_block) {
					group_outros();
					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});
					check_outros();
				}

				if ((!current || changed.columns) && t1_value !== (t1_value = ctx.column.label || ctx.column.field)) {
					set_data(t1, t1_value);
				}
			}

			if (header_slot && header_slot.p && changed.$$scope) {
				header_slot.p(get_slot_changes(header_slot_1, ctx, changed, get_header_slot_changes), get_slot_context(header_slot_1, ctx, get_header_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(header_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block);
			transition_out(header_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!header_slot) {
				if (detaching) {
					detach(th);
				}

				if (if_block) if_block.d();

				if (detaching) {
					detach(t2);
				}

				dispose_header_slot();
			}

			if (header_slot) header_slot.d(detaching);
		}
	};
}

// (153:2) {#if loading && !hideProgress}
function create_if_block_2$4(ctx) {
	var div, div_transition, current;

	var progresslinear = new ProgressLinear({ $$inline: true });

	return {
		c: function create() {
			div = element("div");
			progresslinear.$$.fragment.c();
			attr(div, "class", "absolute w-full");
			add_location(div, file$u, 153, 4, 5607);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(progresslinear, div, null);
			current = true;
		},

		i: function intro(local) {
			if (current) return;
			transition_in(progresslinear.$$.fragment, local);

			add_render_callback(() => {
				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
				div_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(progresslinear.$$.fragment, local);

			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
			div_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(progresslinear, );

			if (detaching) {
				if (div_transition) div_transition.end();
			}
		}
	};
}

// (173:14) {#if editable && column.editable !== false && editing[j] === i}
function create_if_block_1$7(ctx) {
	var div, current;

	const edit_dialog_slot_1 = ctx.$$slots["edit-dialog"];
	const edit_dialog_slot = create_slot(edit_dialog_slot_1, ctx, get_edit_dialog_slot_context);

	function blur_handler(...args) {
		return ctx.blur_handler(ctx, ...args);
	}

	var textfield = new TextField({
		props: {
		value: ctx.item[ctx.column.field],
		textarea: ctx.column.textarea,
		remove: "bg-gray-100 bg-gray-300"
	},
		$$inline: true
	});
	textfield.$on("change", ctx.change_handler);
	textfield.$on("blur", blur_handler);

	return {
		c: function create() {
			if (!edit_dialog_slot) {
				div = element("div");
				textfield.$$.fragment.c();
			}

			if (edit_dialog_slot) edit_dialog_slot.c();
			if (!edit_dialog_slot) {
				attr(div, "class", "absolute left-0 top-0 z-10 bg-white p-2 elevation-3 rounded");
				set_style(div, "width", "300px");
				add_location(div, file$u, 174, 18, 6315);
			}
		},

		l: function claim(nodes) {
			if (edit_dialog_slot) edit_dialog_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!edit_dialog_slot) {
				insert(target, div, anchor);
				mount_component(textfield, div, null);
			}

			else {
				edit_dialog_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if (!edit_dialog_slot) {
				var textfield_changes = {};
				if (changed.sorted || changed.columns) textfield_changes.value = ctx.item[ctx.column.field];
				if (changed.columns) textfield_changes.textarea = ctx.column.textarea;
				textfield.$set(textfield_changes);
			}

			if (edit_dialog_slot && edit_dialog_slot.p && changed.$$scope) {
				edit_dialog_slot.p(get_slot_changes(edit_dialog_slot_1, ctx, changed, get_edit_dialog_slot_changes), get_slot_context(edit_dialog_slot_1, ctx, get_edit_dialog_slot_context));
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(textfield.$$.fragment, local);

			transition_in(edit_dialog_slot, local);
			current = true;
		},

		o: function outro(local) {
			transition_out(textfield.$$.fragment, local);
			transition_out(edit_dialog_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!edit_dialog_slot) {
				if (detaching) {
					detach(div);
				}

				destroy_component(textfield, );
			}

			if (edit_dialog_slot) edit_dialog_slot.d(detaching);
		}
	};
}

// (195:14) {:else}
function create_else_block$4(ctx) {
	var t_value = ctx.item[ctx.column.field], t;

	return {
		c: function create() {
			t = text(t_value);
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.sorted || changed.columns) && t_value !== (t_value = ctx.item[ctx.column.field])) {
				set_data(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (193:14) {#if column.value}
function create_if_block$h(ctx) {
	var raw_value = ctx.column.value(ctx.item), raw_before, raw_after;

	return {
		c: function create() {
			raw_before = element('noscript');
			raw_after = element('noscript');
		},

		m: function mount(target, anchor) {
			insert(target, raw_before, anchor);
			raw_before.insertAdjacentHTML("afterend", raw_value);
			insert(target, raw_after, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.columns || changed.sorted) && raw_value !== (raw_value = ctx.column.value(ctx.item))) {
				detach_between(raw_before, raw_after);
				raw_before.insertAdjacentHTML("afterend", raw_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_between(raw_before, raw_after);
				detach(raw_before);
				detach(raw_after);
			}
		}
	};
}

// (168:10) {#each columns as column, i}
function create_each_block_1(ctx) {
	var td, t0, t1, td_class_value, current;

	var if_block0 = (ctx.editable && ctx.column.editable !== false && ctx.editing[ctx.j] === ctx.i) && create_if_block_1$7(ctx);

	function select_block_type(ctx) {
		if (ctx.column.value) return create_if_block$h;
		return create_else_block$4;
	}

	var current_block_type = select_block_type(ctx);
	var if_block1 = current_block_type(ctx);

	return {
		c: function create() {
			td = element("td");
			if (if_block0) if_block0.c();
			t0 = space();
			if_block1.c();
			t1 = space();
			attr(td, "class", td_class_value = "relative " + ctx.column.class + " svelte-1v2xm10");
			toggle_class(td, "cursor-pointer", ctx.editable && ctx.column.editable !== false);
			add_location(td, file$u, 168, 12, 6038);
		},

		m: function mount(target, anchor) {
			insert(target, td, anchor);
			if (if_block0) if_block0.m(td, null);
			append(td, t0);
			if_block1.m(td, null);
			append(td, t1);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.editable && ctx.column.editable !== false && ctx.editing[ctx.j] === ctx.i) {
				if (if_block0) {
					if_block0.p(changed, ctx);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_1$7(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(td, t0);
				}
			} else if (if_block0) {
				group_outros();
				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});
				check_outros();
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
				if_block1.p(changed, ctx);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type(ctx);
				if (if_block1) {
					if_block1.c();
					if_block1.m(td, t1);
				}
			}

			if ((!current || changed.columns) && td_class_value !== (td_class_value = "relative " + ctx.column.class + " svelte-1v2xm10")) {
				attr(td, "class", td_class_value);
			}

			if ((changed.columns || changed.editable || changed.columns)) {
				toggle_class(td, "cursor-pointer", ctx.editable && ctx.column.editable !== false);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},

		o: function outro(local) {
			transition_out(if_block0);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(td);
			}

			if (if_block0) if_block0.d();
			if_block1.d();
		}
	};
}

// (159:4) {#each sorted as item, j}
function create_each_block$3(ctx) {
	var tr, t, dispose_item_slot, current;

	const item_slot_1 = ctx.$$slots.item;
	const item_slot = create_slot(item_slot_1, ctx, get_item_slot_context$2);

	var each_value_1 = ctx.columns;

	var each_blocks = [];

	for (var i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	function click_handler_1(...args) {
		return ctx.click_handler_1(ctx, ...args);
	}

	return {
		c: function create() {
			if (!item_slot) {
				tr = element("tr");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t = space();
			}

			if (item_slot) item_slot.c();
			if (!item_slot) {
				attr(tr, "class", "svelte-1v2xm10");
				toggle_class(tr, "selected", ctx.editing[ctx.j]);
				add_location(tr, file$u, 160, 8, 5771);
				dispose_item_slot = listen(tr, "click", click_handler_1);
			}
		},

		l: function claim(nodes) {
			if (item_slot) item_slot.l(nodes);
		},

		m: function mount(target, anchor) {
			if (!item_slot) {
				insert(target, tr, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(tr, null);
				}

				insert(target, t, anchor);
			}

			else {
				item_slot.m(target, anchor);
			}

			current = true;
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if (!item_slot) {
				if (changed.columns || changed.editable || changed.sorted || changed.editing || changed.$$scope) {
					each_value_1 = ctx.columns;

					for (var i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(tr, null);
						}
					}

					group_outros();
					for (i = each_value_1.length; i < each_blocks.length; i += 1) out(i);
					check_outros();
				}

				if (changed.editing) {
					toggle_class(tr, "selected", ctx.editing[ctx.j]);
				}
			}

			if (item_slot && item_slot.p && changed.$$scope) {
				item_slot.p(get_slot_changes(item_slot_1, ctx, changed, get_item_slot_changes$2), get_slot_context(item_slot_1, ctx, get_item_slot_context$2));
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value_1.length; i += 1) transition_in(each_blocks[i]);

			transition_in(item_slot, local);
			current = true;
		},

		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			transition_out(item_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (!item_slot) {
				if (detaching) {
					detach(tr);
				}

				destroy_each(each_blocks, detaching);

				if (detaching) {
					detach(t);
				}

				dispose_item_slot();
			}

			if (item_slot) item_slot.d(detaching);
		}
	};
}

function create_fragment$v(ctx) {
	var table_1, thead, t0, t1, tbody, t2, tfoot, tr, td, div2, t3, div0, t5, updating_value, t6, t7, div1, t8, t9, t10_value = ctx.offset + ctx.perPage > ctx.data.length ? ctx.data.length : ctx.offset + ctx.perPage, t10, t11, t12_value = ctx.data.length, t12, t13, t14, t15, current;

	var each_value_2 = ctx.columns;

	var each_blocks_1 = [];

	for (var i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	var if_block = (ctx.loading && !ctx.hideProgress) && create_if_block_2$4();

	var each_value = ctx.sorted;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const pagination_slot_1 = ctx.$$slots.pagination;
	const pagination_slot = create_slot(pagination_slot_1, ctx, get_pagination_slot_context);

	var spacer0 = new Spacer$1({ $$inline: true });

	function select_value_binding(value) {
		ctx.select_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let select_props = {
		c: "w-16",
		remove: "bg-gray-300 bg-gray-100",
		replace: { 'pt-6': 'pt-4' },
		wrapperBaseClasses: func,
		appendBaseClasses: func_1,
		noUnderline: true,
		items: ctx.perPageOptions
	};
	if (ctx.perPage !== void 0) {
		select_props.value = ctx.perPage;
	}
	var select = new Select({ props: select_props, $$inline: true });

	binding_callbacks.push(() => bind(select, 'value', select_value_binding));

	var spacer1 = new Spacer$1({ $$inline: true });

	var button0_spread_levels = [
		{ disabled: (ctx.page - 1) < 1 },
		{ icon: "keyboard_arrow_left" },
		ctx.paginatorProps
	];

	let button0_props = {};
	for (var i = 0; i < button0_spread_levels.length; i += 1) {
		button0_props = assign(button0_props, button0_spread_levels[i]);
	}
	var button0 = new Button({ props: button0_props, $$inline: true });
	button0.$on("click", ctx.click_handler_2);

	var button1_spread_levels = [
		{ disabled: ctx.page === ctx.pagesCount },
		{ icon: "keyboard_arrow_right" },
		ctx.paginatorProps
	];

	let button1_props = {};
	for (var i = 0; i < button1_spread_levels.length; i += 1) {
		button1_props = assign(button1_props, button1_spread_levels[i]);
	}
	var button1 = new Button({ props: button1_props, $$inline: true });
	button1.$on("click", ctx.click_handler_3);

	const footer_slot_1 = ctx.$$slots.footer;
	const footer_slot = create_slot(footer_slot_1, ctx, get_footer_slot_context);

	return {
		c: function create() {
			table_1 = element("table");
			thead = element("thead");

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			tbody = element("tbody");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();

			if (!pagination_slot) {
				tfoot = element("tfoot");
				tr = element("tr");
				td = element("td");
				div2 = element("div");
				spacer0.$$.fragment.c();
				t3 = space();
				div0 = element("div");
				div0.textContent = "Rows per page:";
				t5 = space();
				select.$$.fragment.c();
				t6 = space();
				spacer1.$$.fragment.c();
				t7 = space();
				div1 = element("div");
				t8 = text(ctx.offset);
				t9 = text("-");
				t10 = text(t10_value);
				t11 = text(" of ");
				t12 = text(t12_value);
				t13 = space();
				button0.$$.fragment.c();
				t14 = space();
				button1.$$.fragment.c();
			}

			if (pagination_slot) pagination_slot.c();
			t15 = space();

			if (footer_slot) footer_slot.c();
			attr(thead, "class", "items-center");
			add_location(thead, file$u, 126, 2, 4800);
			add_location(tbody, file$u, 157, 2, 5700);

			if (!pagination_slot) {
				attr(div0, "class", "mr-1 py-1");
				add_location(div0, file$u, 209, 10, 7448);
				add_location(div1, file$u, 221, 10, 7929);
				attr(div2, "class", "flex justify-between items-center text-gray-700 text-sm w-full");
				add_location(div2, file$u, 207, 8, 7340);
				attr(td, "colspan", "100%");
				attr(td, "class", "svelte-1v2xm10");
				add_location(td, file$u, 206, 6, 7312);
				attr(tr, "class", "svelte-1v2xm10");
				add_location(tr, file$u, 205, 4, 7301);
				add_location(tfoot, file$u, 204, 2, 7289);
			}

			attr(table_1, "class", "" + ctx.wrapperClasses + " svelte-1v2xm10");
			add_location(table_1, file$u, 125, 0, 4749);
		},

		l: function claim(nodes) {
			if (pagination_slot) pagination_slot.l(table_1_nodes);

			if (footer_slot) footer_slot.l(table_1_nodes);
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, table_1, anchor);
			append(table_1, thead);

			for (var i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(thead, null);
			}

			append(table_1, t0);
			if (if_block) if_block.m(table_1, null);
			append(table_1, t1);
			append(table_1, tbody);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}

			append(table_1, t2);

			if (!pagination_slot) {
				append(table_1, tfoot);
				append(tfoot, tr);
				append(tr, td);
				append(td, div2);
				mount_component(spacer0, div2, null);
				append(div2, t3);
				append(div2, div0);
				append(div2, t5);
				mount_component(select, div2, null);
				append(div2, t6);
				mount_component(spacer1, div2, null);
				append(div2, t7);
				append(div2, div1);
				append(div1, t8);
				append(div1, t9);
				append(div1, t10);
				append(div1, t11);
				append(div1, t12);
				append(div2, t13);
				mount_component(button0, div2, null);
				append(div2, t14);
				mount_component(button1, div2, null);
			}

			else {
				pagination_slot.m(table_1, null);
			}

			append(table_1, t15);

			if (footer_slot) {
				footer_slot.m(table_1, null);
			}

			ctx.table_1_binding(table_1);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.columns || changed.asc || changed.sortBy || changed.$$scope) {
				each_value_2 = ctx.columns;

				for (var i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(changed, child_ctx);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(thead, null);
					}
				}

				group_outros();
				for (i = each_value_2.length; i < each_blocks_1.length; i += 1) out(i);
				check_outros();
			}

			if (ctx.loading && !ctx.hideProgress) {
				if (!if_block) {
					if_block = create_if_block_2$4();
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(table_1, t1);
				} else {
									transition_in(if_block, 1);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}

			if (changed.editing || changed.columns || changed.editable || changed.sorted || changed.$$scope) {
				each_value = ctx.sorted;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out_1(i);
				check_outros();
			}

			if (!pagination_slot) {
				var select_changes = {};
				if (changed.perPageOptions) select_changes.items = ctx.perPageOptions;
				if (!updating_value && changed.perPage) {
					select_changes.value = ctx.perPage;
				}
				select.$set(select_changes);

				if (!current || changed.offset) {
					set_data(t8, ctx.offset);
				}

				if ((!current || changed.offset || changed.perPage || changed.data) && t10_value !== (t10_value = ctx.offset + ctx.perPage > ctx.data.length ? ctx.data.length : ctx.offset + ctx.perPage)) {
					set_data(t10, t10_value);
				}

				if ((!current || changed.data) && t12_value !== (t12_value = ctx.data.length)) {
					set_data(t12, t12_value);
				}

				var button0_changes = (changed.page || changed.paginatorProps) ? get_spread_update(button0_spread_levels, [
					(changed.page) && { disabled: (ctx.page - 1) < 1 },
					{ icon: "keyboard_arrow_left" },
					(changed.paginatorProps) && ctx.paginatorProps
				]) : {};
				button0.$set(button0_changes);

				var button1_changes = (changed.page || changed.pagesCount || changed.paginatorProps) ? get_spread_update(button1_spread_levels, [
					(changed.page || changed.pagesCount) && { disabled: ctx.page === ctx.pagesCount },
					{ icon: "keyboard_arrow_right" },
					(changed.paginatorProps) && ctx.paginatorProps
				]) : {};
				button1.$set(button1_changes);
			}

			if (pagination_slot && pagination_slot.p && changed.$$scope) {
				pagination_slot.p(get_slot_changes(pagination_slot_1, ctx, changed, get_pagination_slot_changes), get_slot_context(pagination_slot_1, ctx, get_pagination_slot_context));
			}

			if (footer_slot && footer_slot.p && changed.$$scope) {
				footer_slot.p(get_slot_changes(footer_slot_1, ctx, changed, get_footer_slot_changes), get_slot_context(footer_slot_1, ctx, get_footer_slot_context));
			}

			if (!current || changed.wrapperClasses) {
				attr(table_1, "class", "" + ctx.wrapperClasses + " svelte-1v2xm10");
			}
		},

		i: function intro(local) {
			if (current) return;
			for (var i = 0; i < each_value_2.length; i += 1) transition_in(each_blocks_1[i]);

			transition_in(if_block);

			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			transition_in(spacer0.$$.fragment, local);

			transition_in(select.$$.fragment, local);

			transition_in(spacer1.$$.fragment, local);

			transition_in(button0.$$.fragment, local);

			transition_in(button1.$$.fragment, local);

			transition_in(pagination_slot, local);
			transition_in(footer_slot, local);
			current = true;
		},

		o: function outro(local) {
			each_blocks_1 = each_blocks_1.filter(Boolean);
			for (let i = 0; i < each_blocks_1.length; i += 1) transition_out(each_blocks_1[i]);

			transition_out(if_block);

			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			transition_out(spacer0.$$.fragment, local);
			transition_out(select.$$.fragment, local);
			transition_out(spacer1.$$.fragment, local);
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			transition_out(pagination_slot, local);
			transition_out(footer_slot, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(table_1);
			}

			destroy_each(each_blocks_1, detaching);

			if (if_block) if_block.d();

			destroy_each(each_blocks, detaching);

			if (!pagination_slot) {
				destroy_component(spacer0, );

				destroy_component(select, );

				destroy_component(spacer1, );

				destroy_component(button0, );

				destroy_component(button1, );
			}

			if (pagination_slot) pagination_slot.d(detaching);

			if (footer_slot) footer_slot.d(detaching);
			ctx.table_1_binding(null);
		}
	};
}

function func(c) {
	return c.replace('select', 'h-8').replace('mt-2', '');
}

function func_1(c) {
	return c.replace('pt-4', 'pt-3').replace('pr-4', 'pr-2');
}

function instance$t($$self, $$props, $$invalidate) {
	

  let { data = [], columns = Object.keys(data[0] || {})
    .map(i => ({ label: (i || '').replace('_', ' '), field: i })) } = $$props;
  let { page = 1, sort: sort$1 = sort, perPage = 10, perPageOptions = [10, 20, 50], asc = false, loading = false, hideProgress = false, wrapperClasses = "rounded elevation-3 relative", editable = true, paginatorProps = {
    color: "gray",
    text: true,
    flat: true,
    dark: true,
    remove: 'px-4 px-3',
    iconClasses: (c) => c.replace('p-4', ''),
    disabledClasses: (c) => c
      .replace('text-gray-500', 'text-gray-200')
      .replace('bg-gray-300', 'bg-transparent')
      .replace('text-gray-700', ''),
    add: 'ripple-gray',
  } } = $$props;

  let table = "";
  let sortBy = null;

  const dispatch = createEventDispatcher();

  let editing = false;

	const writable_props = ['data', 'columns', 'page', 'sort', 'perPage', 'perPageOptions', 'asc', 'loading', 'hideProgress', 'wrapperClasses', 'editable', 'paginatorProps'];
	Object_1.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DataTable> was created with unknown prop '${key}'`);
	});

	let { $$slots = {}, $$scope } = $$props;

	function change_handler(event) {
		bubble($$self, event);
	}

	function click_handler({ column }) {
	            if (column.sortable === false) return;
	            dispatch("sort", column);

	            editing = false; $$invalidate('editing', editing);
	            asc = sortBy === column ? !asc : false; $$invalidate('asc', asc);
	            sortBy = column; $$invalidate('sortBy', sortBy);
	          }

	function blur_handler({ item, column }, { target }) {
	                        editing = false; $$invalidate('editing', editing);
	                        dispatch('update', {
	                          item,
	                          column,
	                          value: target.value
	                        });
	                      }

	function click_handler_1({ j }, e) {
	          if (!editable) return;
	            editing = { [j]: (e.path.find(a => a.localName === 'td') || {}).cellIndex }; $$invalidate('editing', editing);
	          }

	function select_value_binding(value) {
		perPage = value;
		$$invalidate('perPage', perPage);
	}

	function click_handler_2() {
	              page -= 1; $$invalidate('page', page), $$invalidate('perPage', perPage);
	              table.scrollIntoView({ behavior: 'smooth' });
	            }

	function click_handler_3() {
	              page += 1; $$invalidate('page', page), $$invalidate('perPage', perPage);
	              table.scrollIntoView({ behavior: 'smooth' });
	            }

	function table_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			$$invalidate('table', table = $$value);
		});
	}

	$$self.$set = $$props => {
		if ('data' in $$props) $$invalidate('data', data = $$props.data);
		if ('columns' in $$props) $$invalidate('columns', columns = $$props.columns);
		if ('page' in $$props) $$invalidate('page', page = $$props.page);
		if ('sort' in $$props) $$invalidate('sort', sort$1 = $$props.sort);
		if ('perPage' in $$props) $$invalidate('perPage', perPage = $$props.perPage);
		if ('perPageOptions' in $$props) $$invalidate('perPageOptions', perPageOptions = $$props.perPageOptions);
		if ('asc' in $$props) $$invalidate('asc', asc = $$props.asc);
		if ('loading' in $$props) $$invalidate('loading', loading = $$props.loading);
		if ('hideProgress' in $$props) $$invalidate('hideProgress', hideProgress = $$props.hideProgress);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('editable' in $$props) $$invalidate('editable', editable = $$props.editable);
		if ('paginatorProps' in $$props) $$invalidate('paginatorProps', paginatorProps = $$props.paginatorProps);
		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
	};

	let offset, sorted, pagesCount;

	$$self.$$.update = ($$dirty = { perPage: 1, page: 1, sort: 1, data: 1, sortBy: 1, asc: 1, offset: 1 }) => {
		if ($$dirty.perPage) { {
        $$invalidate('perPage', perPage);
        $$invalidate('page', page = 1);
      } }
		if ($$dirty.page || $$dirty.perPage) { $$invalidate('offset', offset = (page * perPage) - perPage); }
		if ($$dirty.sort || $$dirty.data || $$dirty.sortBy || $$dirty.asc || $$dirty.offset || $$dirty.perPage) { $$invalidate('sorted', sorted = sort$1(data, sortBy, asc).slice(offset, perPage + offset)); }
		if ($$dirty.data || $$dirty.perPage) { $$invalidate('pagesCount', pagesCount = Math.ceil(data.length / perPage)); }
	};

	return {
		data,
		columns,
		page,
		sort: sort$1,
		perPage,
		perPageOptions,
		asc,
		loading,
		hideProgress,
		wrapperClasses,
		editable,
		paginatorProps,
		table,
		sortBy,
		dispatch,
		editing,
		offset,
		sorted,
		pagesCount,
		change_handler,
		click_handler,
		blur_handler,
		click_handler_1,
		select_value_binding,
		click_handler_2,
		click_handler_3,
		table_1_binding,
		$$slots,
		$$scope
	};
}

class DataTable extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$t, create_fragment$v, safe_not_equal, ["data", "columns", "page", "sort", "perPage", "perPageOptions", "asc", "loading", "hideProgress", "wrapperClasses", "editable", "paginatorProps"]);
	}

	get data() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set data(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get columns() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set columns(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get page() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set page(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get sort() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set sort(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get perPage() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set perPage(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get perPageOptions() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set perPageOptions(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get asc() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set asc(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get loading() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set loading(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideProgress() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideProgress(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get editable() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set editable(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get paginatorProps() {
		throw new Error("<DataTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set paginatorProps(value) {
		throw new Error("<DataTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules\smelte\src\components\Switch\Switch.svelte generated by Svelte v3.6.7 */

const file$v = "node_modules\\smelte\\src\\components\\Switch\\Switch.svelte";

// (26:4) <Ripple color={value && !disabled ? color : 'gray'}>
function create_default_slot$b(ctx) {
	var div;

	return {
		c: function create() {
			div = element("div");
			attr(div, "class", "w-full h-full absolute");
			add_location(div, file$v, 26, 6, 862);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment$w(ctx) {
	var div2, input, t0, div1, t1, div0, div0_style_value, t2, label_1, t3, current, dispose;

	var ripple = new Ripple$1({
		props: {
		color: ctx.value && !ctx.disabled ? ctx.color : 'gray',
		$$slots: { default: [create_default_slot$b] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			div2 = element("div");
			input = element("input");
			t0 = space();
			div1 = element("div");
			ripple.$$.fragment.c();
			t1 = space();
			div0 = element("div");
			t2 = space();
			label_1 = element("label");
			t3 = text(ctx.label);
			attr(input, "class", "hidden");
			attr(input, "type", "checkbox");
			add_location(input, file$v, 20, 2, 640);
			attr(div0, "class", ctx.thumbClasses);
			attr(div0, "style", div0_style_value = ctx.value ? 'left: 1.25rem' : '');
			toggle_class(div0, "bg-white", !ctx.value);
			toggle_class(div0, "bg-primary-400", ctx.value);
			toggle_class(div0, "left-0", !ctx.value);
			add_location(div0, file$v, 28, 4, 919);
			attr(div1, "class", ctx.trackClasses);
			toggle_class(div1, "bg-gray-300", !ctx.value);
			toggle_class(div1, "bg-primary-200", ctx.value);
			add_location(div1, file$v, 21, 2, 704);
			attr(label_1, "aria-hidden", "true");
			attr(label_1, "class", ctx.labelClasses);
			toggle_class(label_1, "text-gray-500", ctx.disabled);
			toggle_class(label_1, "text-gray-700", !ctx.disabled);
			add_location(label_1, file$v, 35, 2, 1101);
			attr(div2, "class", ctx.wrapperClasses);
			add_location(div2, file$v, 19, 0, 592);

			dispose = [
				listen(input, "change", ctx.input_change_handler),
				listen(input, "change", ctx.change_handler),
				listen(div2, "click", ctx.check)
			];
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div2, anchor);
			append(div2, input);

			input.value = ctx.value;

			append(div2, t0);
			append(div2, div1);
			mount_component(ripple, div1, null);
			append(div1, t1);
			append(div1, div0);
			append(div2, t2);
			append(div2, label_1);
			append(label_1, t3);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.value) input.value = ctx.value;

			var ripple_changes = {};
			if (changed.value || changed.disabled || changed.color) ripple_changes.color = ctx.value && !ctx.disabled ? ctx.color : 'gray';
			if (changed.$$scope) ripple_changes.$$scope = { changed, ctx };
			ripple.$set(ripple_changes);

			if (!current || changed.thumbClasses) {
				attr(div0, "class", ctx.thumbClasses);
			}

			if ((!current || changed.value) && div0_style_value !== (div0_style_value = ctx.value ? 'left: 1.25rem' : '')) {
				attr(div0, "style", div0_style_value);
			}

			if ((changed.thumbClasses || changed.value)) {
				toggle_class(div0, "bg-white", !ctx.value);
				toggle_class(div0, "bg-primary-400", ctx.value);
				toggle_class(div0, "left-0", !ctx.value);
			}

			if (!current || changed.trackClasses) {
				attr(div1, "class", ctx.trackClasses);
			}

			if ((changed.trackClasses || changed.value)) {
				toggle_class(div1, "bg-gray-300", !ctx.value);
				toggle_class(div1, "bg-primary-200", ctx.value);
			}

			if (!current || changed.label) {
				set_data(t3, ctx.label);
			}

			if (!current || changed.labelClasses) {
				attr(label_1, "class", ctx.labelClasses);
			}

			if ((changed.labelClasses || changed.disabled)) {
				toggle_class(label_1, "text-gray-500", ctx.disabled);
				toggle_class(label_1, "text-gray-700", !ctx.disabled);
			}

			if (!current || changed.wrapperClasses) {
				attr(div2, "class", ctx.wrapperClasses);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(ripple.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(ripple.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div2);
			}

			destroy_component(ripple, );

			run_all(dispose);
		}
	};
}

function instance$u($$self, $$props, $$invalidate) {
	let { value = false, label = "", color = "primary", disabled = false, wrapperClasses = "inline-flex items-center mb-2 cursor-pointer z-10", trackClasses = "relative w-10 h-auto z-0 rounded-full overflow-visible flex items-center justify-center", thumbClasses = "rounded-full p-2 w-5 h-5 absolute elevation-3 transition-fast", labelClasses = "pl-2 cursor-pointer" } = $$props;

  function check() {
    if (disabled) return;

    $$invalidate('value', value = !value);
  }

	const writable_props = ['value', 'label', 'color', 'disabled', 'wrapperClasses', 'trackClasses', 'thumbClasses', 'labelClasses'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switch> was created with unknown prop '${key}'`);
	});

	function change_handler(event) {
		bubble($$self, event);
	}

	function input_change_handler() {
		value = this.value;
		$$invalidate('value', value);
	}

	$$self.$set = $$props => {
		if ('value' in $$props) $$invalidate('value', value = $$props.value);
		if ('label' in $$props) $$invalidate('label', label = $$props.label);
		if ('color' in $$props) $$invalidate('color', color = $$props.color);
		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
		if ('wrapperClasses' in $$props) $$invalidate('wrapperClasses', wrapperClasses = $$props.wrapperClasses);
		if ('trackClasses' in $$props) $$invalidate('trackClasses', trackClasses = $$props.trackClasses);
		if ('thumbClasses' in $$props) $$invalidate('thumbClasses', thumbClasses = $$props.thumbClasses);
		if ('labelClasses' in $$props) $$invalidate('labelClasses', labelClasses = $$props.labelClasses);
	};

	return {
		value,
		label,
		color,
		disabled,
		wrapperClasses,
		trackClasses,
		thumbClasses,
		labelClasses,
		check,
		change_handler,
		input_change_handler
	};
}

class Switch extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$u, create_fragment$w, safe_not_equal, ["value", "label", "color", "disabled", "wrapperClasses", "trackClasses", "thumbClasses", "labelClasses"]);
	}

	get value() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get wrapperClasses() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set wrapperClasses(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get trackClasses() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set trackClasses(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get thumbClasses() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set thumbClasses(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get labelClasses() {
		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set labelClasses(value) {
		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

var ripple = "<div class=\"text-center cursor-pointer w-64 p-4 border-pink-200 border-2 ripple-pink\">\n  I ripple pink\n</div>";

/* src\routes\Color.svelte generated by Svelte v3.6.7 */

const file$w = "src\\routes\\Color.svelte";

function create_fragment$x(ctx) {
	var h40, t1, p, t2, a0, t4, a1, t6, a2, t8, a3, t10, t11, h50, t13, span0, t14, t15_value = '{color}-{variant}', t15, t16, t17, div0, t19, h51, t21, span1, t22, t23_value = '{color}-{variant}', t23, t24, t25, h41, t27, h52, t29, span2, t30, t31_value = '{n}', t31, t32, span3, t33, t34_value = '{solid|dashed|dotted|none}', t34, t35, t36, div1, t38, h53, t40, a4, t42, span4, t43, t44_value = '{color}', t44, t45, t46, div2, current;

	var code0 = new Code({
		props: { code: '<div class="bg-deep-purple-500 text-white p-4">This div is deep purple.</div>' },
		$$inline: true
	});

	var code1 = new Code({
		props: { code: '<h4 class="text-lime-500">This header is lime</h4>' },
		$$inline: true
	});

	var code2 = new Code({
		props: { code: '<div class="border-2 border-amber-600 p-4">This div has amber border</div>' },
		$$inline: true
	});

	var code3 = new Code({
		props: { code: ripple },
		$$inline: true
	});

	return {
		c: function create() {
			h40 = element("h4");
			h40.textContent = "Color helper classes";
			t1 = space();
			p = element("p");
			t2 = text("Right now Smelte adds very little to what Tailwind\n  ");
			a0 = element("a");
			a0.textContent = "has";
			t4 = space();
			a1 = element("a");
			a1.textContent = "to offer";
			t6 = text("\n  dealing with color except for porting the Material design color\n  ");
			a2 = element("a");
			a2.textContent = "palette";
			t8 = text("\n  and adding a few extra utilities like caret color on inputs or colored ripple\n  animation effect. Colors themselves are configured in\n  ");
			a3 = element("a");
			a3.textContent = "tailwind.config.js";
			t10 = text("\n  .");
			t11 = space();
			h50 = element("h5");
			h50.textContent = "Background";
			t13 = space();
			span0 = element("span");
			t14 = text(".bg-");
			t15 = text(t15_value);
			t16 = text("\ngives element appropriate background color:\n");
			code0.$$.fragment.c();
			t17 = space();
			div0 = element("div");
			div0.textContent = "This div is deep purple.";
			t19 = space();
			h51 = element("h5");
			h51.textContent = "Text";
			t21 = space();
			span1 = element("span");
			t22 = text(".text-");
			t23 = text(t23_value);
			t24 = text("\nchanges text color accordingly:\n");
			code1.$$.fragment.c();
			t25 = space();
			h41 = element("h4");
			h41.textContent = "This header is lime";
			t27 = space();
			h52 = element("h5");
			h52.textContent = "Border";
			t29 = text("\nSame principle applies to border, but there are also border width\n");
			span2 = element("span");
			t30 = text("border-");
			t31 = text(t31_value);
			t32 = text("\nand type\n");
			span3 = element("span");
			t33 = text("border-");
			t34 = text(t34_value);
			t35 = text("\nhelpers.\n");
			code2.$$.fragment.c();
			t36 = space();
			div1 = element("div");
			div1.textContent = "This div has amber border";
			t38 = space();
			h53 = element("h5");
			h53.textContent = "Ripple";
			t40 = text("\nThis is css only version of the infamous ripple effect taken from\n");
			a4 = element("a");
			a4.textContent = "this great blog";
			t42 = text("\nand turned into a Tailwind utility\n");
			span4 = element("span");
			t43 = text(".ripple-");
			t44 = text(t44_value);
			t45 = space();
			code3.$$.fragment.c();
			t46 = space();
			div2 = element("div");
			div2.textContent = "I ripple pink";
			attr(h40, "class", "pb-8");
			add_location(h40, file$w, 7, 0, 136);
			attr(a0, "class", "a");
			attr(a0, "href", "https://tailwindcss.com/docs/background-color/");
			add_location(a0, file$w, 10, 2, 238);
			attr(a1, "class", "a");
			attr(a1, "href", "https://tailwindcss.com/docs/text-color/");
			add_location(a1, file$w, 11, 2, 315);
			attr(a2, "class", "a");
			attr(a2, "href", "https://material.io/design/color/#tools-for-picking-colors");
			add_location(a2, file$w, 13, 2, 457);
			attr(a3, "class", "a");
			attr(a3, "href", "https://github.com/matyunya/smelte/blob/master/tailwind.config.js");
			add_location(a3, file$w, 20, 2, 702);
			add_location(p, file$w, 8, 0, 179);
			attr(h50, "class", "mt-6 mb-2");
			add_location(h50, file$w, 28, 0, 837);
			attr(span0, "class", "body-2");
			add_location(span0, file$w, 30, 0, 876);
			attr(div0, "class", "bg-deep-purple-500 text-white p-4");
			add_location(div0, file$w, 34, 0, 1072);
			attr(h51, "class", "mt-6 mb-2");
			add_location(h51, file$w, 36, 0, 1151);
			attr(span1, "class", "body-2");
			add_location(span1, file$w, 38, 0, 1184);
			attr(h41, "class", "text-lime-500");
			add_location(h41, file$w, 41, 0, 1341);
			attr(h52, "class", "mt-6 mb-2");
			add_location(h52, file$w, 43, 0, 1393);
			attr(span2, "class", "body-2");
			add_location(span2, file$w, 45, 0, 1493);
			attr(span3, "class", "body-2");
			add_location(span3, file$w, 47, 0, 1545);
			attr(div1, "class", "border-2 border-amber-600 p-4");
			add_location(div1, file$w, 52, 0, 1716);
			attr(h53, "class", "mt-6 mb-2");
			add_location(h53, file$w, 54, 0, 1792);
			attr(a4, "class", "a");
			attr(a4, "href", "https://codeburst.io/create-a-material-design-ripple-effect-without-js-9d3cbee25b3e");
			add_location(a4, file$w, 56, 0, 1892);
			attr(span4, "class", "body-2");
			add_location(span4, file$w, 62, 0, 2059);
			attr(div2, "class", "text-center cursor-pointer w-64 p-4 border-pink-200 border-2\n  ripple-pink");
			add_location(div2, file$w, 65, 0, 2131);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h40, anchor);
			insert(target, t1, anchor);
			insert(target, p, anchor);
			append(p, t2);
			append(p, a0);
			append(p, t4);
			append(p, a1);
			append(p, t6);
			append(p, a2);
			append(p, t8);
			append(p, a3);
			append(p, t10);
			insert(target, t11, anchor);
			insert(target, h50, anchor);
			insert(target, t13, anchor);
			insert(target, span0, anchor);
			append(span0, t14);
			append(span0, t15);
			insert(target, t16, anchor);
			mount_component(code0, target, anchor);
			insert(target, t17, anchor);
			insert(target, div0, anchor);
			insert(target, t19, anchor);
			insert(target, h51, anchor);
			insert(target, t21, anchor);
			insert(target, span1, anchor);
			append(span1, t22);
			append(span1, t23);
			insert(target, t24, anchor);
			mount_component(code1, target, anchor);
			insert(target, t25, anchor);
			insert(target, h41, anchor);
			insert(target, t27, anchor);
			insert(target, h52, anchor);
			insert(target, t29, anchor);
			insert(target, span2, anchor);
			append(span2, t30);
			append(span2, t31);
			insert(target, t32, anchor);
			insert(target, span3, anchor);
			append(span3, t33);
			append(span3, t34);
			insert(target, t35, anchor);
			mount_component(code2, target, anchor);
			insert(target, t36, anchor);
			insert(target, div1, anchor);
			insert(target, t38, anchor);
			insert(target, h53, anchor);
			insert(target, t40, anchor);
			insert(target, a4, anchor);
			insert(target, t42, anchor);
			insert(target, span4, anchor);
			append(span4, t43);
			append(span4, t44);
			insert(target, t45, anchor);
			mount_component(code3, target, anchor);
			insert(target, t46, anchor);
			insert(target, div2, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var code3_changes = {};
			if (changed.ripple) code3_changes.code = ripple;
			code3.$set(code3_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);

			transition_in(code1.$$.fragment, local);

			transition_in(code2.$$.fragment, local);

			transition_in(code3.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(code2.$$.fragment, local);
			transition_out(code3.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h40);
				detach(t1);
				detach(p);
				detach(t11);
				detach(h50);
				detach(t13);
				detach(span0);
				detach(t16);
			}

			destroy_component(code0, detaching);

			if (detaching) {
				detach(t17);
				detach(div0);
				detach(t19);
				detach(h51);
				detach(t21);
				detach(span1);
				detach(t24);
			}

			destroy_component(code1, detaching);

			if (detaching) {
				detach(t25);
				detach(h41);
				detach(t27);
				detach(h52);
				detach(t29);
				detach(span2);
				detach(t32);
				detach(span3);
				detach(t35);
			}

			destroy_component(code2, detaching);

			if (detaching) {
				detach(t36);
				detach(div1);
				detach(t38);
				detach(h53);
				detach(t40);
				detach(a4);
				detach(t42);
				detach(span4);
				detach(t45);
			}

			destroy_component(code3, detaching);

			if (detaching) {
				detach(t46);
				detach(div2);
			}
		}
	};
}

class Color extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$x, safe_not_equal, []);
	}
}

/* src\routes\Typography.svelte generated by Svelte v3.6.7 */

const file$x = "src\\routes\\Typography.svelte";

function create_fragment$y(ctx) {
	var div5, h40, t1, p, t2, a, t4, t5, div4, h1, t7, h2, t9, h3, t11, h41, t13, h5, t15, h6, t17, div0, t19, div1, t21, div2, t23, div3, t25, caption;

	return {
		c: function create() {
			div5 = element("div");
			h40 = element("h4");
			h40.textContent = "Typography defaults and helper classes";
			t1 = space();
			p = element("p");
			t2 = text("H1-h6, subtitle, body and caption as well as their respected classes (.h1,\n    .h2...) use Material design\n    ");
			a = element("a");
			a.textContent = "type scale";
			t4 = text("\n    .");
			t5 = space();
			div4 = element("div");
			h1 = element("h1");
			h1.textContent = ".h1 header 1";
			t7 = space();
			h2 = element("h2");
			h2.textContent = ".h2 header 2";
			t9 = space();
			h3 = element("h3");
			h3.textContent = ".h3 header 3";
			t11 = space();
			h41 = element("h4");
			h41.textContent = ".h4 header 4";
			t13 = space();
			h5 = element("h5");
			h5.textContent = ".h5 header 5";
			t15 = space();
			h6 = element("h6");
			h6.textContent = ".h6 header 6";
			t17 = space();
			div0 = element("div");
			div0.textContent = ".subtitle-1";
			t19 = space();
			div1 = element("div");
			div1.textContent = ".subtitle-2";
			t21 = space();
			div2 = element("div");
			div2.textContent = ".body-1";
			t23 = space();
			div3 = element("div");
			div3.textContent = ".body-2";
			t25 = space();
			caption = element("caption");
			caption.textContent = ".caption";
			attr(h40, "class", "pb-8");
			add_location(h40, file$x, 1, 2, 8);
			attr(a, "class", "a");
			attr(a, "href", "https://material.io/design/typography/the-type-system.html#type-scale");
			add_location(a, file$x, 5, 4, 190);
			add_location(p, file$x, 2, 2, 71);
			add_location(h1, file$x, 13, 4, 373);
			add_location(h2, file$x, 14, 4, 399);
			add_location(h3, file$x, 15, 4, 425);
			add_location(h41, file$x, 16, 4, 451);
			add_location(h5, file$x, 17, 4, 477);
			attr(h6, "class", "mb-3 mt-6");
			add_location(h6, file$x, 18, 4, 503);
			attr(div0, "class", "subtitle-1");
			add_location(div0, file$x, 19, 4, 547);
			attr(div1, "class", "subtitle-2");
			add_location(div1, file$x, 20, 4, 593);
			attr(div2, "class", "body-1");
			add_location(div2, file$x, 21, 4, 639);
			attr(div3, "class", "body-2");
			add_location(div3, file$x, 22, 4, 677);
			add_location(caption, file$x, 23, 4, 715);
			attr(div4, "class", "bg-gray-200 p-4 my-4");
			add_location(div4, file$x, 12, 2, 334);
			add_location(div5, file$x, 0, 0, 0);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div5, anchor);
			append(div5, h40);
			append(div5, t1);
			append(div5, p);
			append(p, t2);
			append(p, a);
			append(p, t4);
			append(div5, t5);
			append(div5, div4);
			append(div4, h1);
			append(div4, t7);
			append(div4, h2);
			append(div4, t9);
			append(div4, h3);
			append(div4, t11);
			append(div4, h41);
			append(div4, t13);
			append(div4, h5);
			append(div4, t15);
			append(div4, h6);
			append(div4, t17);
			append(div4, div0);
			append(div4, t19);
			append(div4, div1);
			append(div4, t21);
			append(div4, div2);
			append(div4, t23);
			append(div4, div3);
			append(div4, t25);
			append(div4, caption);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div5);
			}
		}
	};
}

class Typography extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$y, safe_not_equal, []);
	}
}

var buttons = "<script>\n  import Button from \"components/Button\";\n  import Icon from \"components/Icon\";\n</script>\n\n<h6 class=\"mb-3 mt-6\">Basic</h6>\n<div class=\"py-2\">\n  <Button>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Light</h6>\n<div class=\"py-2\">\n  <Button light>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Dark</h6>\n<div class=\"py-2\">\n  <Button dark>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Block</h6>\n<div class=\"py-2\">\n  <Button color=\"alert\" dark block>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Outlined</h6>\n<div class=\"py-2\">\n  <Button color=\"secondary\" light block outlined>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Text</h6>\n<div class=\"py-2\">\n  <Button text>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Disabled</h6>\n<div class=\"py-2\">\n  <Button block disabled>Button</Button>\n</div>\n\n<h6 class=\"mb-3 mt-6\">Fab</h6>\n<div class=\"py-2\">\n  <Button color=\"alert\" icon=\"change_history\" />\n</div>\n\n<h6 class=\"mb-3 mt-6\">Fab flat</h6>\n<div class=\"py-2\">\n  <Button color=\"error\" icon=\"change_history\" text light flat />\n</div>";

/* src\routes\components\buttons.svelte generated by Svelte v3.6.7 */

const file$y = "src\\routes\\components\\buttons.svelte";

// (11:2) <Button>
function create_default_slot_6(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (16:2) <Button light>
function create_default_slot_5(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (21:2) <Button dark>
function create_default_slot_4(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (26:2) <Button color="alert" dark block>
function create_default_slot_3(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (31:2) <Button color="secondary" light block outlined>
function create_default_slot_2$2(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (36:2) <Button text>
function create_default_slot_1$5(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (41:2) <Button block disabled>
function create_default_slot$c(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Button");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$z(ctx) {
	var h60, t1, div0, t2, h61, t4, div1, t5, h62, t7, div2, t8, h63, t10, div3, t11, h64, t13, div4, t14, h65, t16, div5, t17, h66, t19, div6, t20, h67, t22, div7, t23, h68, t25, div8, t26, current;

	var button0 = new Button({
		props: {
		$$slots: { default: [create_default_slot_6] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button1 = new Button({
		props: {
		light: true,
		$$slots: { default: [create_default_slot_5] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button2 = new Button({
		props: {
		dark: true,
		$$slots: { default: [create_default_slot_4] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button3 = new Button({
		props: {
		color: "alert",
		dark: true,
		block: true,
		$$slots: { default: [create_default_slot_3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button4 = new Button({
		props: {
		color: "secondary",
		light: true,
		block: true,
		outlined: true,
		$$slots: { default: [create_default_slot_2$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button5 = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_1$5] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button6 = new Button({
		props: {
		block: true,
		disabled: true,
		$$slots: { default: [create_default_slot$c] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button7 = new Button({
		props: { color: "alert", icon: "change_history" },
		$$inline: true
	});

	var button8 = new Button({
		props: {
		color: "error",
		icon: "change_history",
		text: true,
		light: true,
		flat: true
	},
		$$inline: true
	});

	var code = new Code({
		props: { code: buttons },
		$$inline: true
	});

	return {
		c: function create() {
			h60 = element("h6");
			h60.textContent = "Basic";
			t1 = space();
			div0 = element("div");
			button0.$$.fragment.c();
			t2 = space();
			h61 = element("h6");
			h61.textContent = "Light";
			t4 = space();
			div1 = element("div");
			button1.$$.fragment.c();
			t5 = space();
			h62 = element("h6");
			h62.textContent = "Dark";
			t7 = space();
			div2 = element("div");
			button2.$$.fragment.c();
			t8 = space();
			h63 = element("h6");
			h63.textContent = "Block";
			t10 = space();
			div3 = element("div");
			button3.$$.fragment.c();
			t11 = space();
			h64 = element("h6");
			h64.textContent = "Outlined";
			t13 = space();
			div4 = element("div");
			button4.$$.fragment.c();
			t14 = space();
			h65 = element("h6");
			h65.textContent = "Text";
			t16 = space();
			div5 = element("div");
			button5.$$.fragment.c();
			t17 = space();
			h66 = element("h6");
			h66.textContent = "Disabled";
			t19 = space();
			div6 = element("div");
			button6.$$.fragment.c();
			t20 = space();
			h67 = element("h6");
			h67.textContent = "Fab";
			t22 = space();
			div7 = element("div");
			button7.$$.fragment.c();
			t23 = space();
			h68 = element("h6");
			h68.textContent = "Fab flat";
			t25 = space();
			div8 = element("div");
			button8.$$.fragment.c();
			t26 = space();
			code.$$.fragment.c();
			attr(h60, "class", "mb-3 mt-6");
			add_location(h60, file$y, 8, 0, 187);
			attr(div0, "class", "py-2");
			add_location(div0, file$y, 9, 0, 220);
			attr(h61, "class", "mb-3 mt-6");
			add_location(h61, file$y, 13, 0, 273);
			attr(div1, "class", "py-2");
			add_location(div1, file$y, 14, 0, 306);
			attr(h62, "class", "mb-3 mt-6");
			add_location(h62, file$y, 18, 0, 365);
			attr(div2, "class", "py-2");
			add_location(div2, file$y, 19, 0, 397);
			attr(h63, "class", "mb-3 mt-6");
			add_location(h63, file$y, 23, 0, 455);
			attr(div3, "class", "py-2");
			add_location(div3, file$y, 24, 0, 488);
			attr(h64, "class", "mb-3 mt-6");
			add_location(h64, file$y, 28, 0, 566);
			attr(div4, "class", "py-2");
			add_location(div4, file$y, 29, 0, 602);
			attr(h65, "class", "mb-3 mt-6");
			add_location(h65, file$y, 33, 0, 694);
			attr(div5, "class", "py-2");
			add_location(div5, file$y, 34, 0, 726);
			attr(h66, "class", "mb-3 mt-6");
			add_location(h66, file$y, 38, 0, 784);
			attr(div6, "class", "py-2");
			add_location(div6, file$y, 39, 0, 820);
			attr(h67, "class", "mb-3 mt-6");
			add_location(h67, file$y, 43, 0, 888);
			attr(div7, "class", "py-2");
			add_location(div7, file$y, 44, 0, 919);
			attr(h68, "class", "mb-3 mt-6");
			add_location(h68, file$y, 48, 0, 995);
			attr(div8, "class", "py-2");
			add_location(div8, file$y, 49, 0, 1031);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h60, anchor);
			insert(target, t1, anchor);
			insert(target, div0, anchor);
			mount_component(button0, div0, null);
			insert(target, t2, anchor);
			insert(target, h61, anchor);
			insert(target, t4, anchor);
			insert(target, div1, anchor);
			mount_component(button1, div1, null);
			insert(target, t5, anchor);
			insert(target, h62, anchor);
			insert(target, t7, anchor);
			insert(target, div2, anchor);
			mount_component(button2, div2, null);
			insert(target, t8, anchor);
			insert(target, h63, anchor);
			insert(target, t10, anchor);
			insert(target, div3, anchor);
			mount_component(button3, div3, null);
			insert(target, t11, anchor);
			insert(target, h64, anchor);
			insert(target, t13, anchor);
			insert(target, div4, anchor);
			mount_component(button4, div4, null);
			insert(target, t14, anchor);
			insert(target, h65, anchor);
			insert(target, t16, anchor);
			insert(target, div5, anchor);
			mount_component(button5, div5, null);
			insert(target, t17, anchor);
			insert(target, h66, anchor);
			insert(target, t19, anchor);
			insert(target, div6, anchor);
			mount_component(button6, div6, null);
			insert(target, t20, anchor);
			insert(target, h67, anchor);
			insert(target, t22, anchor);
			insert(target, div7, anchor);
			mount_component(button7, div7, null);
			insert(target, t23, anchor);
			insert(target, h68, anchor);
			insert(target, t25, anchor);
			insert(target, div8, anchor);
			mount_component(button8, div8, null);
			insert(target, t26, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var button0_changes = {};
			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
			button0.$set(button0_changes);

			var button1_changes = {};
			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
			button1.$set(button1_changes);

			var button2_changes = {};
			if (changed.$$scope) button2_changes.$$scope = { changed, ctx };
			button2.$set(button2_changes);

			var button3_changes = {};
			if (changed.$$scope) button3_changes.$$scope = { changed, ctx };
			button3.$set(button3_changes);

			var button4_changes = {};
			if (changed.$$scope) button4_changes.$$scope = { changed, ctx };
			button4.$set(button4_changes);

			var button5_changes = {};
			if (changed.$$scope) button5_changes.$$scope = { changed, ctx };
			button5.$set(button5_changes);

			var button6_changes = {};
			if (changed.$$scope) button6_changes.$$scope = { changed, ctx };
			button6.$set(button6_changes);

			var code_changes = {};
			if (changed.buttons) code_changes.code = buttons;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);

			transition_in(button1.$$.fragment, local);

			transition_in(button2.$$.fragment, local);

			transition_in(button3.$$.fragment, local);

			transition_in(button4.$$.fragment, local);

			transition_in(button5.$$.fragment, local);

			transition_in(button6.$$.fragment, local);

			transition_in(button7.$$.fragment, local);

			transition_in(button8.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			transition_out(button2.$$.fragment, local);
			transition_out(button3.$$.fragment, local);
			transition_out(button4.$$.fragment, local);
			transition_out(button5.$$.fragment, local);
			transition_out(button6.$$.fragment, local);
			transition_out(button7.$$.fragment, local);
			transition_out(button8.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h60);
				detach(t1);
				detach(div0);
			}

			destroy_component(button0, );

			if (detaching) {
				detach(t2);
				detach(h61);
				detach(t4);
				detach(div1);
			}

			destroy_component(button1, );

			if (detaching) {
				detach(t5);
				detach(h62);
				detach(t7);
				detach(div2);
			}

			destroy_component(button2, );

			if (detaching) {
				detach(t8);
				detach(h63);
				detach(t10);
				detach(div3);
			}

			destroy_component(button3, );

			if (detaching) {
				detach(t11);
				detach(h64);
				detach(t13);
				detach(div4);
			}

			destroy_component(button4, );

			if (detaching) {
				detach(t14);
				detach(h65);
				detach(t16);
				detach(div5);
			}

			destroy_component(button5, );

			if (detaching) {
				detach(t17);
				detach(h66);
				detach(t19);
				detach(div6);
			}

			destroy_component(button6, );

			if (detaching) {
				detach(t20);
				detach(h67);
				detach(t22);
				detach(div7);
			}

			destroy_component(button7, );

			if (detaching) {
				detach(t23);
				detach(h68);
				detach(t25);
				detach(div8);
			}

			destroy_component(button8, );

			if (detaching) {
				detach(t26);
			}

			destroy_component(code, detaching);
		}
	};
}

class Buttons extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$z, safe_not_equal, []);
	}
}

var card = "<script>\n\timport Card from 'components/Card';\n\timport Button from 'components/Button';\n\timport Image from 'components/Image';\n</script>\n\n<Card.Card>\n\t<div slot=\"title\">\n\t\t<Card.Title\n\t\t\ttitle=\"The three little kittens\"\n\t\t\tsubheader=\"A kitten poem\"\n\t\t\tavatar=\"https://placekitten.com/64/64\"\n\t\t/>\n\t</div>\n\t<div slot=\"media\">\n\t\t<Image c=\"w-full\"\n\t\t\tsrc=\"https://placekitten.com/300/200\"\n\t\t\talt=\"kitty\"\n\t\t/>\n\t</div>\n\t<div slot=\"text\" class=\"p-5 pb-0 pt-3 text-gray-700 body-2\">\n\t\tThe three little kittens, they lost their mittens,<br>\n\t\tAnd they began to cry,<br>\n\t\t\"Oh, mother dear, we sadly fear,<br>\n\t\tThat we have lost our mittens.\"\n\t</div>\n\t<div slot=\"actions\">\n\t\t<div class=\"p-2\">\n\t\t\t<Button text>OK</Button>\n\t\t\t<Button text>Meow</Button>\n\t\t</div>\n\t</div>\n</Card.Card>";

/* src\routes\components\cards.svelte generated by Svelte v3.6.7 */

const file$z = "src\\routes\\components\\cards.svelte";

// (12:2) <div slot="title">
function create_title_slot(ctx) {
	var div, current;

	var card_title = new Card$1.Title({
		props: {
		title: "The three little kittens",
		subheader: "A kitten poem",
		avatar: "https://placekitten.com/64/64"
	},
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			card_title.$$.fragment.c();
			attr(div, "slot", "title");
			add_location(div, file$z, 11, 2, 234);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(card_title, div, null);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(card_title.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(card_title.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(card_title, );
		}
	};
}

// (18:2) <div slot="media">
function create_media_slot(ctx) {
	var div, current;

	var image = new Image_1({
		props: {
		c: "w-full",
		src: "https://placekitten.com/300/200",
		alt: "kitty"
	},
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			image.$$.fragment.c();
			attr(div, "slot", "media");
			add_location(div, file$z, 17, 2, 399);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(image, div, null);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(image.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(image.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(image, );
		}
	};
}

// (21:2) <div slot="text" class="p-5 pb-0 pt-3 text-gray-700 body-2">
function create_text_slot(ctx) {
	var div, t0, br0, t1, br1, t2, br2, t3;

	return {
		c: function create() {
			div = element("div");
			t0 = text("The three little kittens, they lost their mittens,\n    ");
			br0 = element("br");
			t1 = text("\n    And they began to cry,\n    ");
			br1 = element("br");
			t2 = text("\n    \"Oh, mother dear, we sadly fear,\n    ");
			br2 = element("br");
			t3 = text("\n    That we have lost our mittens.\"");
			add_location(br0, file$z, 22, 4, 624);
			add_location(br1, file$z, 24, 4, 662);
			add_location(br2, file$z, 26, 4, 710);
			attr(div, "slot", "text");
			attr(div, "class", "p-5 pb-0 pt-3 text-gray-700 body-2");
			add_location(div, file$z, 20, 2, 504);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, br0);
			append(div, t1);
			append(div, br1);
			append(div, t2);
			append(div, br2);
			append(div, t3);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (32:6) <Button text>
function create_default_slot_2$3(ctx) {
	var t;

	return {
		c: function create() {
			t = text("OK");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (33:6) <Button text>
function create_default_slot_1$6(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Meow");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (30:2) <div slot="actions">
function create_actions_slot(ctx) {
	var div0, div1, t, current;

	var button0 = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_2$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var button1 = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_1$6] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			div0 = element("div");
			div1 = element("div");
			button0.$$.fragment.c();
			t = space();
			button1.$$.fragment.c();
			attr(div1, "class", "p-2");
			add_location(div1, file$z, 30, 4, 789);
			attr(div0, "slot", "actions");
			add_location(div0, file$z, 29, 2, 764);
		},

		m: function mount(target, anchor) {
			insert(target, div0, anchor);
			append(div0, div1);
			mount_component(button0, div1, null);
			append(div1, t);
			mount_component(button1, div1, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var button0_changes = {};
			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
			button0.$set(button0_changes);

			var button1_changes = {};
			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
			button1.$set(button1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);

			transition_in(button1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div0);
			}

			destroy_component(button0, );

			destroy_component(button1, );
		}
	};
}

// (11:0) <Card.Card>
function create_default_slot$d(ctx) {
	var t0, t1, t2;

	return {
		c: function create() {
			t0 = space();
			t1 = space();
			t2 = space();
		},

		m: function mount(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
			insert(target, t2, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(t0);
				detach(t1);
				detach(t2);
			}
		}
	};
}

function create_fragment$A(ctx) {
	var t, current;

	var card_card = new Card$1.Card({
		props: {
		$$slots: {
		default: [create_default_slot$d],
		actions: [create_actions_slot],
		text: [create_text_slot],
		media: [create_media_slot],
		title: [create_title_slot]
	},
		$$scope: { ctx }
	},
		$$inline: true
	});

	var code = new Code({
		props: { code: card },
		$$inline: true
	});

	return {
		c: function create() {
			card_card.$$.fragment.c();
			t = space();
			code.$$.fragment.c();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(card_card, target, anchor);
			insert(target, t, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var card_card_changes = {};
			if (changed.$$scope) card_card_changes.$$scope = { changed, ctx };
			card_card.$set(card_card_changes);

			var code_changes = {};
			if (changed.card) code_changes.code = card;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(card_card.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(card_card.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(card_card, detaching);

			if (detaching) {
				detach(t);
			}

			destroy_component(code, detaching);
		}
	};
}

class Cards extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$A, safe_not_equal, []);
	}
}

var chip = "<script>\n  import Chip from 'components/Chip';\n\n  let closed = false;\n  let clicked = false;\n</script>\n\n<Chip\n  icon=\"face\"\n  removable\n  selectable\n  on:close={() => closed = true}\n  on:click={() => clicked = true}\n>test</Chip>";

var chipOutlined = "<script>\n  import Chip from 'components/Chip';\n\n  let closed = false;\n  let clicked = false;\n</script>\n\n<Chip\n  icon=\"pan_tool\"\n  outlined\n  removable\n  selectable\n  on:close={() => closed = true}\n  on:click={() => clicked = true}\n>Cats</Chip>\n<Chip\n  icon=\"print\"\n  outlined\n  removable\n  selectable\n  on:close={() => closed = true}\n  on:click={() => clicked = true}\n>Dogs</Chip>\n<Chip\n  icon=\"pageview\"\n  outlined\n  removable\n  selectable\n  on:close={() => closed = true}\n  on:click={() => clicked = true}\n>Plants</Chip>\n<Chip\n  icon=\"pets\"\n  outlined\n  removable\n  selectable\n  on:close={() => closed = true}\n  on:click={() => clicked = true}\n>Parents</Chip>";

/* src\routes\components\chips.svelte generated by Svelte v3.6.7 */

const file$A = "src\\routes\\components\\chips.svelte";

// (15:0) <Chip   icon="face"   removable   selectable   on:close={() => (closed = true)}   on:click={() => (clicked = true)}>
function create_default_slot_8(ctx) {
	var t;

	return {
		c: function create() {
			t = text("test");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (29:0) <Chip   icon="pan_tool"   outlined   removable   selectable   on:close={() => (closed = true)}   on:click={() => (clicked = true)}>
function create_default_slot_7(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Cats");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (38:0) <Chip   icon="print"   outlined   removable   selectable   on:close={() => (closed = true)}   on:click={() => (clicked = true)}>
function create_default_slot_6$1(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Dogs");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (47:0) <Chip   icon="pageview"   outlined   removable   selectable   on:close={() => (closed = true)}   on:click={() => (clicked = true)}>
function create_default_slot_5$1(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Plants");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (56:0) <Chip   icon="pets"   outlined   removable   selectable   on:close={() => (closed = true)}   on:click={() => (clicked = true)}>
function create_default_slot_4$1(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Parents");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (73:4) <Button text on:click={() => (closed = false)}>
function create_default_slot_3$1(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Dismiss");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (72:2) <div slot="action">
function create_action_slot_1(ctx) {
	var div, current;

	var button = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_3$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler_5);

	return {
		c: function create() {
			div = element("div");
			button.$$.fragment.c();
			attr(div, "slot", "action");
			add_location(div, file$A, 71, 2, 1309);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(button, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(button, );
		}
	};
}

// (70:0) <Snackbar bind:value={closed}>
function create_default_slot_2$4(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Chip was removed successfully.\n  ");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (80:4) <Button text on:click={() => (clicked = false)}>
function create_default_slot_1$7(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Dismiss");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (79:2) <div slot="action">
function create_action_slot(ctx) {
	var div, current;

	var button = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_1$7] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler_6);

	return {
		c: function create() {
			div = element("div");
			button.$$.fragment.c();
			attr(div, "slot", "action");
			add_location(div, file$A, 78, 2, 1486);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(button, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(button, );
		}
	};
}

// (77:0) <Snackbar bind:value={clicked}>
function create_default_slot$e(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Chip was clicked successfully.\n  ");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$B(ctx) {
	var h50, t1, t2, div0, t3, h51, t5, t6, t7, t8, t9, div1, t10, updating_value, t11, updating_value_1, current;

	var chip0 = new Chip({
		props: {
		icon: "face",
		removable: true,
		selectable: true,
		$$slots: { default: [create_default_slot_8] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	chip0.$on("close", ctx.close_handler);
	chip0.$on("click", ctx.click_handler);

	var code0 = new Code({
		props: { code: chip },
		$$inline: true
	});

	var chip1 = new Chip({
		props: {
		icon: "pan_tool",
		outlined: true,
		removable: true,
		selectable: true,
		$$slots: { default: [create_default_slot_7] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	chip1.$on("close", ctx.close_handler_1);
	chip1.$on("click", ctx.click_handler_1);

	var chip2 = new Chip({
		props: {
		icon: "print",
		outlined: true,
		removable: true,
		selectable: true,
		$$slots: { default: [create_default_slot_6$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	chip2.$on("close", ctx.close_handler_2);
	chip2.$on("click", ctx.click_handler_2);

	var chip3 = new Chip({
		props: {
		icon: "pageview",
		outlined: true,
		removable: true,
		selectable: true,
		$$slots: { default: [create_default_slot_5$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	chip3.$on("close", ctx.close_handler_3);
	chip3.$on("click", ctx.click_handler_3);

	var chip4 = new Chip({
		props: {
		icon: "pets",
		outlined: true,
		removable: true,
		selectable: true,
		$$slots: { default: [create_default_slot_4$1] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	chip4.$on("close", ctx.close_handler_4);
	chip4.$on("click", ctx.click_handler_4);

	var code1 = new Code({
		props: { lang: "javascript", code: chipOutlined },
		$$inline: true
	});

	function snackbar0_value_binding(value) {
		ctx.snackbar0_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let snackbar0_props = {
		$$slots: {
		default: [create_default_slot_2$4],
		action: [create_action_slot_1]
	},
		$$scope: { ctx }
	};
	if (ctx.closed !== void 0) {
		snackbar0_props.value = ctx.closed;
	}
	var snackbar0 = new Snackbar({ props: snackbar0_props, $$inline: true });

	binding_callbacks.push(() => bind(snackbar0, 'value', snackbar0_value_binding));

	function snackbar1_value_binding(value_1) {
		ctx.snackbar1_value_binding.call(null, value_1);
		updating_value_1 = true;
		add_flush_callback(() => updating_value_1 = false);
	}

	let snackbar1_props = {
		$$slots: {
		default: [create_default_slot$e],
		action: [create_action_slot]
	},
		$$scope: { ctx }
	};
	if (ctx.clicked !== void 0) {
		snackbar1_props.value = ctx.clicked;
	}
	var snackbar1 = new Snackbar({ props: snackbar1_props, $$inline: true });

	binding_callbacks.push(() => bind(snackbar1, 'value', snackbar1_value_binding));

	return {
		c: function create() {
			h50 = element("h5");
			h50.textContent = "Basic";
			t1 = space();
			chip0.$$.fragment.c();
			t2 = space();
			div0 = element("div");
			code0.$$.fragment.c();
			t3 = space();
			h51 = element("h5");
			h51.textContent = "Outlined";
			t5 = space();
			chip1.$$.fragment.c();
			t6 = space();
			chip2.$$.fragment.c();
			t7 = space();
			chip3.$$.fragment.c();
			t8 = space();
			chip4.$$.fragment.c();
			t9 = space();
			div1 = element("div");
			code1.$$.fragment.c();
			t10 = space();
			snackbar0.$$.fragment.c();
			t11 = space();
			snackbar1.$$.fragment.c();
			attr(h50, "class", "mt-6 mb-2");
			add_location(h50, file$A, 13, 0, 328);
			attr(div0, "class", "my-4");
			add_location(div0, file$A, 23, 0, 494);
			attr(h51, "class", "mt-6 mb-2");
			add_location(h51, file$A, 27, 0, 544);
			attr(div1, "class", "my-4");
			add_location(div1, file$A, 65, 0, 1167);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h50, anchor);
			insert(target, t1, anchor);
			mount_component(chip0, target, anchor);
			insert(target, t2, anchor);
			insert(target, div0, anchor);
			mount_component(code0, div0, null);
			insert(target, t3, anchor);
			insert(target, h51, anchor);
			insert(target, t5, anchor);
			mount_component(chip1, target, anchor);
			insert(target, t6, anchor);
			mount_component(chip2, target, anchor);
			insert(target, t7, anchor);
			mount_component(chip3, target, anchor);
			insert(target, t8, anchor);
			mount_component(chip4, target, anchor);
			insert(target, t9, anchor);
			insert(target, div1, anchor);
			mount_component(code1, div1, null);
			insert(target, t10, anchor);
			mount_component(snackbar0, target, anchor);
			insert(target, t11, anchor);
			mount_component(snackbar1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var chip0_changes = {};
			if (changed.$$scope) chip0_changes.$$scope = { changed, ctx };
			chip0.$set(chip0_changes);

			var code0_changes = {};
			if (changed.chip) code0_changes.code = chip;
			code0.$set(code0_changes);

			var chip1_changes = {};
			if (changed.$$scope) chip1_changes.$$scope = { changed, ctx };
			chip1.$set(chip1_changes);

			var chip2_changes = {};
			if (changed.$$scope) chip2_changes.$$scope = { changed, ctx };
			chip2.$set(chip2_changes);

			var chip3_changes = {};
			if (changed.$$scope) chip3_changes.$$scope = { changed, ctx };
			chip3.$set(chip3_changes);

			var chip4_changes = {};
			if (changed.$$scope) chip4_changes.$$scope = { changed, ctx };
			chip4.$set(chip4_changes);

			var code1_changes = {};
			if (changed.chipOutlined) code1_changes.code = chipOutlined;
			code1.$set(code1_changes);

			var snackbar0_changes = {};
			if (changed.$$scope) snackbar0_changes.$$scope = { changed, ctx };
			if (!updating_value && changed.closed) {
				snackbar0_changes.value = ctx.closed;
			}
			snackbar0.$set(snackbar0_changes);

			var snackbar1_changes = {};
			if (changed.$$scope) snackbar1_changes.$$scope = { changed, ctx };
			if (!updating_value_1 && changed.clicked) {
				snackbar1_changes.value = ctx.clicked;
			}
			snackbar1.$set(snackbar1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(chip0.$$.fragment, local);

			transition_in(code0.$$.fragment, local);

			transition_in(chip1.$$.fragment, local);

			transition_in(chip2.$$.fragment, local);

			transition_in(chip3.$$.fragment, local);

			transition_in(chip4.$$.fragment, local);

			transition_in(code1.$$.fragment, local);

			transition_in(snackbar0.$$.fragment, local);

			transition_in(snackbar1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(chip0.$$.fragment, local);
			transition_out(code0.$$.fragment, local);
			transition_out(chip1.$$.fragment, local);
			transition_out(chip2.$$.fragment, local);
			transition_out(chip3.$$.fragment, local);
			transition_out(chip4.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			transition_out(snackbar0.$$.fragment, local);
			transition_out(snackbar1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h50);
				detach(t1);
			}

			destroy_component(chip0, detaching);

			if (detaching) {
				detach(t2);
				detach(div0);
			}

			destroy_component(code0, );

			if (detaching) {
				detach(t3);
				detach(h51);
				detach(t5);
			}

			destroy_component(chip1, detaching);

			if (detaching) {
				detach(t6);
			}

			destroy_component(chip2, detaching);

			if (detaching) {
				detach(t7);
			}

			destroy_component(chip3, detaching);

			if (detaching) {
				detach(t8);
			}

			destroy_component(chip4, detaching);

			if (detaching) {
				detach(t9);
				detach(div1);
			}

			destroy_component(code1, );

			if (detaching) {
				detach(t10);
			}

			destroy_component(snackbar0, detaching);

			if (detaching) {
				detach(t11);
			}

			destroy_component(snackbar1, detaching);
		}
	};
}

function instance$v($$self, $$props, $$invalidate) {
	

  let closed = false;
  let clicked = false;

	function close_handler() {
		const $$result = (closed = true);
		$$invalidate('closed', closed);
		return $$result;
	}

	function click_handler() {
		const $$result = (clicked = true);
		$$invalidate('clicked', clicked);
		return $$result;
	}

	function close_handler_1() {
		const $$result = (closed = true);
		$$invalidate('closed', closed);
		return $$result;
	}

	function click_handler_1() {
		const $$result = (clicked = true);
		$$invalidate('clicked', clicked);
		return $$result;
	}

	function close_handler_2() {
		const $$result = (closed = true);
		$$invalidate('closed', closed);
		return $$result;
	}

	function click_handler_2() {
		const $$result = (clicked = true);
		$$invalidate('clicked', clicked);
		return $$result;
	}

	function close_handler_3() {
		const $$result = (closed = true);
		$$invalidate('closed', closed);
		return $$result;
	}

	function click_handler_3() {
		const $$result = (clicked = true);
		$$invalidate('clicked', clicked);
		return $$result;
	}

	function close_handler_4() {
		const $$result = (closed = true);
		$$invalidate('closed', closed);
		return $$result;
	}

	function click_handler_4() {
		const $$result = (clicked = true);
		$$invalidate('clicked', clicked);
		return $$result;
	}

	function click_handler_5() {
		const $$result = (closed = false);
		$$invalidate('closed', closed);
		return $$result;
	}

	function snackbar0_value_binding(value) {
		closed = value;
		$$invalidate('closed', closed);
	}

	function click_handler_6() {
		const $$result = (clicked = false);
		$$invalidate('clicked', clicked);
		return $$result;
	}

	function snackbar1_value_binding(value_1) {
		clicked = value_1;
		$$invalidate('clicked', clicked);
	}

	return {
		closed,
		clicked,
		close_handler,
		click_handler,
		close_handler_1,
		click_handler_1,
		close_handler_2,
		click_handler_2,
		close_handler_3,
		click_handler_3,
		close_handler_4,
		click_handler_4,
		click_handler_5,
		snackbar0_value_binding,
		click_handler_6,
		snackbar1_value_binding
	};
}

class Chips extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$v, create_fragment$B, safe_not_equal, []);
	}
}

var table = "<script>\n  import DataTable from \"components/DataTable\";\n\n  import data from \"./data.json\";\n</script>\n\n<DataTable\n  data={data._embedded.episodes}\n  columns={[\n    { label: \"ID\", field: \"id\", class: \"w-10\", },\n    {\n      label: \"Season/Episode\",\n      value: (v) => `S${v.season}E${v.number}`,\n      class: \"w-10\"\n    },\n    { field: \"name\", class: \"w-10\" },\n    {\n      field: \"summary\",\n      value: v => v && v.summary ? v.summary : \"\",\n      class: \"text-sm text-gray-700 caption w-full\" },\n    {\n      field: \"thumbnail\",\n      value: (v) => v && v.image\n        ? `<img src=\"${v.image.medium.replace(\"http\", \"https\")}\" height=\"70\" alt=\"${v.name}\">`\n        : \"\",\n      class: \"w-48\",\n      sortable: false,\n    }\n  ]}\n/>\n";

/* src\routes\components\data-tables.svelte generated by Svelte v3.6.7 */

const file$B = "src\\routes\\components\\data-tables.svelte";

function create_fragment$C(ctx) {
	var div, t, current;

	var datatable = new DataTable({
		props: {
		data: ctx.data,
		loading: ctx.loading,
		columns: [
      { label: "ID", field: "id", class: "md:w-10", },
      {
        label: "Ep.",
        value: func$1,
        class: "md:w-10",
        editable: false,
      },
      { field: "name", class: "md:w-10" },
      {
        field: "summary",
        textarea: true,
        value: func_1$1,
        class: "text-sm text-gray-700 caption md:w-full sm:w-64"
      },
      {
        field: "thumbnail",
        value: func_2,
        class: "w-48",
        sortable: false,
        editable: false,
      }
    ]
	},
		$$inline: true
	});
	datatable.$on("update", ctx.update_handler);

	var code = new Code({
		props: { code: table },
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			datatable.$$.fragment.c();
			t = space();
			code.$$.fragment.c();
			attr(div, "class", "overflow-auto p-1");
			add_location(div, file$B, 21, 0, 416);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(datatable, div, null);
			append(div, t);
			mount_component(code, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var datatable_changes = {};
			if (changed.data) datatable_changes.data = ctx.data;
			if (changed.loading) datatable_changes.loading = ctx.loading;
			datatable.$set(datatable_changes);

			var code_changes = {};
			if (changed.table) code_changes.code = table;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(datatable.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(datatable.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(datatable, );

			destroy_component(code, );
		}
	};
}

function func$1(v) {
	return `S${v.season}E${v.number}`;
}

function func_1$1(v) {
	return v && v.summary ? v.summary : "";
}

function func_2(v) {
	return v && v.image
          ? `<img src="${v.image.medium.replace("http", "https")}" height="70" alt="${v.name}">`
          : "";
}

function instance$w($$self, $$props, $$invalidate) {
	

  let data = [];
  let loading = true;

  async function getData() {
    $$invalidate('loading', loading = true);
    const res = await fetch("/data.json");
    const body = await res.json();

    $$invalidate('data', data = body._embedded.episodes);

    setTimeout(() => { const $$result = loading = false; $$invalidate('loading', loading); return $$result; }, 500);
  }

  getData();

	function update_handler({ detail }) {
	      const { column, item, value } = detail;

	      const index = data.findIndex(i => i.id === item.id);

	      data[index][column.field] = value; $$invalidate('data', data);
	    }

	return { data, loading, update_handler };
}

class Data_tables extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$w, create_fragment$C, safe_not_equal, []);
	}
}

var dialog = "<script>\n\timport Dialog from 'components/Dialog';\n\timport Button from 'components/Button';\n  \n  let showDialog = false;\n</script>\n\n<Dialog bind:value={showDialog}>\n  <h5 slot=\"title\">What do you think?</h5>\n  <div class=\"text-gray-700\">I'm not sure about today's weather.</div>\n  <div slot=\"actions\">\n    <Button text on:click={() => showDialog = false}>Disagree</Button>\n    <Button text on:click={() => showDialog = false}>Agree</Button>\n  </div>\n</Dialog>\n\n<div class=\"py-2\">\n  <Button on:click={() => showDialog = true}>Show dialog</Button>\n</div>";

/* src\routes\components\dialogs.svelte generated by Svelte v3.6.7 */

const file$C = "src\\routes\\components\\dialogs.svelte";

// (11:2) <h5 slot="title">
function create_title_slot$1(ctx) {
	var h5;

	return {
		c: function create() {
			h5 = element("h5");
			h5.textContent = "What do you think?";
			attr(h5, "slot", "title");
			add_location(h5, file$C, 10, 2, 248);
		},

		m: function mount(target, anchor) {
			insert(target, h5, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h5);
			}
		}
	};
}

// (14:4) <Button text on:click={() => (showDialog = false)}>
function create_default_slot_3$2(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Disagree");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (15:4) <Button text on:click={() => (showDialog = false)}>
function create_default_slot_2$5(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Agree");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (13:2) <div slot="actions">
function create_actions_slot$1(ctx) {
	var div, t, current;

	var button0 = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_3$2] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button0.$on("click", ctx.click_handler);

	var button1 = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_2$5] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button1.$on("click", ctx.click_handler_1);

	return {
		c: function create() {
			div = element("div");
			button0.$$.fragment.c();
			t = space();
			button1.$$.fragment.c();
			attr(div, "slot", "actions");
			add_location(div, file$C, 12, 2, 362);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(button0, div, null);
			append(div, t);
			mount_component(button1, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var button0_changes = {};
			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
			button0.$set(button0_changes);

			var button1_changes = {};
			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
			button1.$set(button1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);

			transition_in(button1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(button0, );

			destroy_component(button1, );
		}
	};
}

// (10:0) <Dialog bind:value={showDialog}>
function create_default_slot_1$8(ctx) {
	var t0, div, t2;

	return {
		c: function create() {
			t0 = space();
			div = element("div");
			div.textContent = "I'm not sure about today's weather.";
			t2 = space();
			attr(div, "class", "text-gray-700");
			add_location(div, file$C, 11, 2, 291);
		},

		m: function mount(target, anchor) {
			insert(target, t0, anchor);
			insert(target, div, anchor);
			insert(target, t2, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(t0);
				detach(div);
				detach(t2);
			}
		}
	};
}

// (20:2) <Button on:click={() => (showDialog = true)}>
function create_default_slot$f(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Show dialog");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$D(ctx) {
	var updating_value, t0, div, t1, current;

	function dialog_1_value_binding(value) {
		ctx.dialog_1_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let dialog_1_props = {
		$$slots: {
		default: [create_default_slot_1$8],
		actions: [create_actions_slot$1],
		title: [create_title_slot$1]
	},
		$$scope: { ctx }
	};
	if (ctx.showDialog !== void 0) {
		dialog_1_props.value = ctx.showDialog;
	}
	var dialog_1 = new Dialog({ props: dialog_1_props, $$inline: true });

	binding_callbacks.push(() => bind(dialog_1, 'value', dialog_1_value_binding));

	var button = new Button({
		props: {
		$$slots: { default: [create_default_slot$f] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler_2);

	var code = new Code({
		props: { code: dialog },
		$$inline: true
	});

	return {
		c: function create() {
			dialog_1.$$.fragment.c();
			t0 = space();
			div = element("div");
			button.$$.fragment.c();
			t1 = space();
			code.$$.fragment.c();
			attr(div, "class", "py-2");
			add_location(div, file$C, 18, 0, 546);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(dialog_1, target, anchor);
			insert(target, t0, anchor);
			insert(target, div, anchor);
			mount_component(button, div, null);
			insert(target, t1, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var dialog_1_changes = {};
			if (changed.$$scope) dialog_1_changes.$$scope = { changed, ctx };
			if (!updating_value && changed.showDialog) {
				dialog_1_changes.value = ctx.showDialog;
			}
			dialog_1.$set(dialog_1_changes);

			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);

			var code_changes = {};
			if (changed.dialog) code_changes.code = dialog;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(dialog_1.$$.fragment, local);

			transition_in(button.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(dialog_1.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(dialog_1, detaching);

			if (detaching) {
				detach(t0);
				detach(div);
			}

			destroy_component(button, );

			if (detaching) {
				detach(t1);
			}

			destroy_component(code, detaching);
		}
	};
}

function instance$x($$self, $$props, $$invalidate) {
	

  let showDialog = false;

	function click_handler() {
		const $$result = (showDialog = false);
		$$invalidate('showDialog', showDialog);
		return $$result;
	}

	function click_handler_1() {
		const $$result = (showDialog = false);
		$$invalidate('showDialog', showDialog);
		return $$result;
	}

	function dialog_1_value_binding(value) {
		showDialog = value;
		$$invalidate('showDialog', showDialog);
	}

	function click_handler_2() {
		const $$result = (showDialog = true);
		$$invalidate('showDialog', showDialog);
		return $$result;
	}

	return {
		showDialog,
		click_handler,
		click_handler_1,
		dialog_1_value_binding,
		click_handler_2
	};
}

class Dialogs extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$x, create_fragment$D, safe_not_equal, []);
	}
}

var images = "<script>\n  import Image from 'components/Image';\n\n  const range = [...new Array(50)];\n</script>\n\n\n{#each range as _, i}\n  <div class=\"my-8\">\n    <Image\n      src=\"https://placeimg.com/{400 + i}/{300 + i}/animals\"\n      alt=\"Kitty {i}\"\n      height={400 + 1}\n      width={300 +1}\n    />\n  </div>\n{/each}";

/* src\routes\components\images.svelte generated by Svelte v3.6.7 */

const file$D = "src\\routes\\components\\images.svelte";

function get_each_context$4(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx._ = list[i];
	child_ctx.i = i;
	return child_ctx;
}

// (12:0) {#each range as _, i}
function create_each_block$4(ctx) {
	var div, t, current;

	var image = new Image_1({
		props: {
		src: "https://placeimg.com/" + (400 + ctx.i) + "/" + (300 + ctx.i) + "/animals",
		alt: "Kitty " + ctx.i,
		height: 400 + 1,
		width: 300 + 1
	},
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			image.$$.fragment.c();
			t = space();
			attr(div, "class", "my-8");
			add_location(div, file$D, 12, 2, 228);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(image, div, null);
			append(div, t);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(image.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(image.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(image, );
		}
	};
}

function create_fragment$E(ctx) {
	var t, each_1_anchor, current;

	var code = new Code({
		props: { code: images },
		$$inline: true
	});

	var each_value = ctx.range;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c: function create() {
			code.$$.fragment.c();
			t = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(code, target, anchor);
			insert(target, t, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var code_changes = {};
			if (changed.images) code_changes.code = images;
			code.$set(code_changes);

			if (changed.range) {
				each_value = ctx.range;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();
				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(code.$$.fragment, local);

			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

			current = true;
		},

		o: function outro(local) {
			transition_out(code.$$.fragment, local);

			each_blocks = each_blocks.filter(Boolean);
			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(code, detaching);

			if (detaching) {
				detach(t);
			}

			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach(each_1_anchor);
			}
		}
	};
}

function instance$y($$self) {
	

  const range = [...new Array(50)];

	return { range };
}

class Images extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$y, create_fragment$E, safe_not_equal, []);
	}
}

/* src\routes\components\index.svelte generated by Svelte v3.6.7 */

const file$E = "src\\routes\\components\\index.svelte";

function create_fragment$F(ctx) {
	var h60, t1, t2, h61, t4, t5, h62, t7, t8, h63, t10, t11, h64, t13, t14, h65, t16, t17, h66, t19, current;

	var textfield0 = new TextField({
		props: { label: "Test label" },
		$$inline: true
	});

	var textfield1 = new TextField({
		props: {
		label: "Test label",
		hint: "Test hint",
		persistentHint: true
	},
		$$inline: true
	});

	var textfield2 = new TextField({
		props: { label: "Test label", error: "Test error" },
		$$inline: true
	});

	var textfield3 = new TextField({
		props: { label: "Test label", outlined: true },
		$$inline: true
	});

	var textfield4 = new TextField({
		props: {
		label: "Test label",
		outlined: true,
		hint: "Test hint"
	},
		$$inline: true
	});

	var textfield5 = new TextField({
		props: {
		label: "Test label",
		outlined: true,
		error: "Test error"
	},
		$$inline: true
	});

	var textfield6 = new TextField({
		props: {
		label: "Test label",
		textarea: true,
		rows: "5",
		outlined: true
	},
		$$inline: true
	});

	return {
		c: function create() {
			h60 = element("h6");
			h60.textContent = "Basic";
			t1 = space();
			textfield0.$$.fragment.c();
			t2 = space();
			h61 = element("h6");
			h61.textContent = "With hint";
			t4 = space();
			textfield1.$$.fragment.c();
			t5 = space();
			h62 = element("h6");
			h62.textContent = "With error";
			t7 = space();
			textfield2.$$.fragment.c();
			t8 = space();
			h63 = element("h6");
			h63.textContent = "Outlined";
			t10 = space();
			textfield3.$$.fragment.c();
			t11 = space();
			h64 = element("h6");
			h64.textContent = "Outlined with hint";
			t13 = space();
			textfield4.$$.fragment.c();
			t14 = space();
			h65 = element("h6");
			h65.textContent = "Outlined with error";
			t16 = space();
			textfield5.$$.fragment.c();
			t17 = space();
			h66 = element("h6");
			h66.textContent = "Outlined textarea";
			t19 = space();
			textfield6.$$.fragment.c();
			attr(h60, "class", "mb-3 mt-6");
			add_location(h60, file$E, 6, 0, 104);
			attr(h61, "class", "mb-3 mt-6");
			add_location(h61, file$E, 8, 0, 170);
			attr(h62, "class", "mb-3 mt-6");
			add_location(h62, file$E, 10, 0, 272);
			attr(h63, "class", "mb-3 mt-6");
			add_location(h63, file$E, 12, 0, 362);
			attr(h64, "class", "mb-3 mt-6");
			add_location(h64, file$E, 14, 0, 440);
			attr(h65, "class", "mb-3 mt-6");
			add_location(h65, file$E, 16, 0, 545);
			attr(h66, "class", "mb-3 mt-6");
			add_location(h66, file$E, 18, 0, 653);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h60, anchor);
			insert(target, t1, anchor);
			mount_component(textfield0, target, anchor);
			insert(target, t2, anchor);
			insert(target, h61, anchor);
			insert(target, t4, anchor);
			mount_component(textfield1, target, anchor);
			insert(target, t5, anchor);
			insert(target, h62, anchor);
			insert(target, t7, anchor);
			mount_component(textfield2, target, anchor);
			insert(target, t8, anchor);
			insert(target, h63, anchor);
			insert(target, t10, anchor);
			mount_component(textfield3, target, anchor);
			insert(target, t11, anchor);
			insert(target, h64, anchor);
			insert(target, t13, anchor);
			mount_component(textfield4, target, anchor);
			insert(target, t14, anchor);
			insert(target, h65, anchor);
			insert(target, t16, anchor);
			mount_component(textfield5, target, anchor);
			insert(target, t17, anchor);
			insert(target, h66, anchor);
			insert(target, t19, anchor);
			mount_component(textfield6, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(textfield0.$$.fragment, local);

			transition_in(textfield1.$$.fragment, local);

			transition_in(textfield2.$$.fragment, local);

			transition_in(textfield3.$$.fragment, local);

			transition_in(textfield4.$$.fragment, local);

			transition_in(textfield5.$$.fragment, local);

			transition_in(textfield6.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(textfield0.$$.fragment, local);
			transition_out(textfield1.$$.fragment, local);
			transition_out(textfield2.$$.fragment, local);
			transition_out(textfield3.$$.fragment, local);
			transition_out(textfield4.$$.fragment, local);
			transition_out(textfield5.$$.fragment, local);
			transition_out(textfield6.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h60);
				detach(t1);
			}

			destroy_component(textfield0, detaching);

			if (detaching) {
				detach(t2);
				detach(h61);
				detach(t4);
			}

			destroy_component(textfield1, detaching);

			if (detaching) {
				detach(t5);
				detach(h62);
				detach(t7);
			}

			destroy_component(textfield2, detaching);

			if (detaching) {
				detach(t8);
				detach(h63);
				detach(t10);
			}

			destroy_component(textfield3, detaching);

			if (detaching) {
				detach(t11);
				detach(h64);
				detach(t13);
			}

			destroy_component(textfield4, detaching);

			if (detaching) {
				detach(t14);
				detach(h65);
				detach(t16);
			}

			destroy_component(textfield5, detaching);

			if (detaching) {
				detach(t17);
				detach(h66);
				detach(t19);
			}

			destroy_component(textfield6, detaching);
		}
	};
}

class Index extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$F, safe_not_equal, []);
	}
}

var menus = "<script>\n\timport Button from 'components/Button';\n\timport Menu from 'components/Menu';\n\timport List from 'components/List';\n\n  let open = true;\n\tlet selected = '';\n\n  const items = [\n\t\t{ value: 1, text: 'One' },\n\t\t{ value: 2, text: 'Two' },\n\t\t{ value: 3, text: 'Three' },\n\t\t{ value: 4, text: 'Four' },\n\t\t{ value: 5, text: 'Five' },\n\t];\n\n</script>\n\n<caption>Selected: {selected || 'nothing'}</caption>\n\n<Menu bind:open {items} bind:value={selected}>\n\t<div slot=\"activator\">\n\t\t<Button on:click={() => open = !open}>A menu</Button>\n\t</div>\n</Menu>";

/* src\routes\components\menus.svelte generated by Svelte v3.6.7 */

const file$F = "src\\routes\\components\\menus.svelte";

// (25:4) <Button on:click={() => (open = !open)}>
function create_default_slot_1$9(ctx) {
	var t;

	return {
		c: function create() {
			t = text("A menu");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (24:2) <div slot="activator">
function create_activator_slot(ctx) {
	var div, current;

	var button = new Button({
		props: {
		$$slots: { default: [create_default_slot_1$9] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler);

	return {
		c: function create() {
			div = element("div");
			button.$$.fragment.c();
			attr(div, "slot", "activator");
			add_location(div, file$F, 23, 2, 546);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(button, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(button, );
		}
	};
}

// (23:0) <Menu bind:open {items} bind:value={selected}>
function create_default_slot$g(ctx) {

	return {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
}

function create_fragment$G(ctx) {
	var caption, t0, t1_value = ctx.selected || 'nothing', t1, t2, updating_open, updating_value, t3, current;

	function menu_open_binding(value) {
		ctx.menu_open_binding.call(null, value);
		updating_open = true;
		add_flush_callback(() => updating_open = false);
	}

	function menu_value_binding(value_1) {
		ctx.menu_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let menu_props = {
		items: ctx.items,
		$$slots: {
		default: [create_default_slot$g],
		activator: [create_activator_slot]
	},
		$$scope: { ctx }
	};
	if (ctx.open !== void 0) {
		menu_props.open = ctx.open;
	}
	if (ctx.selected !== void 0) {
		menu_props.value = ctx.selected;
	}
	var menu = new Menu({ props: menu_props, $$inline: true });

	binding_callbacks.push(() => bind(menu, 'open', menu_open_binding));
	binding_callbacks.push(() => bind(menu, 'value', menu_value_binding));

	var code = new Code({
		props: { code: menus },
		$$inline: true
	});

	return {
		c: function create() {
			caption = element("caption");
			t0 = text("Selected: ");
			t1 = text(t1_value);
			t2 = space();
			menu.$$.fragment.c();
			t3 = space();
			code.$$.fragment.c();
			add_location(caption, file$F, 20, 0, 443);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, caption, anchor);
			append(caption, t0);
			append(caption, t1);
			insert(target, t2, anchor);
			mount_component(menu, target, anchor);
			insert(target, t3, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.selected) && t1_value !== (t1_value = ctx.selected || 'nothing')) {
				set_data(t1, t1_value);
			}

			var menu_changes = {};
			if (changed.items) menu_changes.items = ctx.items;
			if (changed.$$scope) menu_changes.$$scope = { changed, ctx };
			if (!updating_open && changed.open) {
				menu_changes.open = ctx.open;
			}
			if (!updating_value && changed.selected) {
				menu_changes.value = ctx.selected;
			}
			menu.$set(menu_changes);

			var code_changes = {};
			if (changed.menus) code_changes.code = menus;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(menu.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(menu.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(caption);
				detach(t2);
			}

			destroy_component(menu, detaching);

			if (detaching) {
				detach(t3);
			}

			destroy_component(code, detaching);
		}
	};
}

function instance$z($$self, $$props, $$invalidate) {
	

  let open = false;
  let selected = "";

  const items = [
    { value: 1, text: "One" },
    { value: 2, text: "Two" },
    { value: 3, text: "Three" },
    { value: 4, text: "Four" },
    { value: 5, text: "Five" }
  ];

	function click_handler() {
		const $$result = (open = !open);
		$$invalidate('open', open);
		return $$result;
	}

	function menu_open_binding(value) {
		open = value;
		$$invalidate('open', open);
	}

	function menu_value_binding(value_1) {
		selected = value_1;
		$$invalidate('selected', selected);
	}

	return {
		open,
		selected,
		items,
		click_handler,
		menu_open_binding,
		menu_value_binding
	};
}

class Menus extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$z, create_fragment$G, safe_not_equal, []);
	}
}

const right$1 = writable(false);
const persistent$1 = writable(true);
const elevation$1 = writable(false);
const showNav$1 = writable(true);

var drawers = "<script>\n  // This is top src/routes/_layout.svelte.\n\n  import NavigationDrawer from 'components/NavigationDrawer';\n  import { right, elevation, persistent, showNav, showNavMobile, breakpoint } from 'stores.js';\n  import List from 'components/List';\n\timport ListItem from 'components/List/ListItem.svelte';\n  const menu = [\n      { to: \"/components/text-fields\", text: 'Text fields' },\n      { to: \"/components/buttons\", text: 'Buttons' },\n      { to: \"/components/selection-controls\", text: 'Selection controls' },\n      { to: \"/components/lists\", text: 'Lists' },\n      ...\n    ];\n</script>\n\n<NavigationDrawer\n  bind:showDesktop={$showNav}\n  bind:showMobile={$showNavMobile}\n  right={$right}\n  persistent={$persistent}\n  elevation={$elevation}\n  breakpoint={$breakpoint}\n>\n  <h6\n    class=\"p-6 ml-1 pb-2 text-xs text-gray-900\"\n  >Components</h6>\n  <List items={menu}>\n    <span slot=\"item\" let:item={item} class=\"cursor-pointer\">\n      {#if item.to === '/typography'}\n        <hr>\n        <h6 class=\"p-6 ml-1 py-2 text-xs text-gray-900\">Utilities</h6>\n      {/if}\n\n      <a href={item.to}>\n        <ListItem\n          selected={path.includes(item.to)}\n          {...item}\n          dense\n          navigation\n        />\n      </a>\n    </span>\n  </List>\n  <hr>\n</NavigationDrawer>";

/* src\routes\components\navigation-drawers.svelte generated by Svelte v3.6.7 */

function create_fragment$H(ctx) {
	var updating_value, t0, updating_value_1, t1, updating_value_2, t2, updating_value_3, t3, current;

	function checkbox0_value_binding(value) {
		ctx.checkbox0_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let checkbox0_props = { label: "Show drawer" };
	if (ctx.$showNav !== void 0) {
		checkbox0_props.value = ctx.$showNav;
	}
	var checkbox0 = new Checkbox({ props: checkbox0_props, $$inline: true });

	binding_callbacks.push(() => bind(checkbox0, 'value', checkbox0_value_binding));
	checkbox0.$on("change", persistent$1.update);

	function checkbox1_value_binding(value_1) {
		ctx.checkbox1_value_binding.call(null, value_1);
		updating_value_1 = true;
		add_flush_callback(() => updating_value_1 = false);
	}

	let checkbox1_props = { label: "With elevation" };
	if (ctx.$elevation !== void 0) {
		checkbox1_props.value = ctx.$elevation;
	}
	var checkbox1 = new Checkbox({ props: checkbox1_props, $$inline: true });

	binding_callbacks.push(() => bind(checkbox1, 'value', checkbox1_value_binding));
	checkbox1.$on("change", elevation$1.update);

	function checkbox2_value_binding(value_2) {
		ctx.checkbox2_value_binding.call(null, value_2);
		updating_value_2 = true;
		add_flush_callback(() => updating_value_2 = false);
	}

	let checkbox2_props = { label: "Placed on the right" };
	if (ctx.$right !== void 0) {
		checkbox2_props.value = ctx.$right;
	}
	var checkbox2 = new Checkbox({ props: checkbox2_props, $$inline: true });

	binding_callbacks.push(() => bind(checkbox2, 'value', checkbox2_value_binding));
	checkbox2.$on("change", right$1.update);

	function checkbox3_value_binding(value_3) {
		ctx.checkbox3_value_binding.call(null, value_3);
		updating_value_3 = true;
		add_flush_callback(() => updating_value_3 = false);
	}

	let checkbox3_props = { label: "Persistent" };
	if (ctx.$persistent !== void 0) {
		checkbox3_props.value = ctx.$persistent;
	}
	var checkbox3 = new Checkbox({ props: checkbox3_props, $$inline: true });

	binding_callbacks.push(() => bind(checkbox3, 'value', checkbox3_value_binding));
	checkbox3.$on("change", persistent$1.update);

	var code = new Code({
		props: { code: drawers },
		$$inline: true
	});

	return {
		c: function create() {
			checkbox0.$$.fragment.c();
			t0 = space();
			checkbox1.$$.fragment.c();
			t1 = space();
			checkbox2.$$.fragment.c();
			t2 = space();
			checkbox3.$$.fragment.c();
			t3 = space();
			code.$$.fragment.c();
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(checkbox0, target, anchor);
			insert(target, t0, anchor);
			mount_component(checkbox1, target, anchor);
			insert(target, t1, anchor);
			mount_component(checkbox2, target, anchor);
			insert(target, t2, anchor);
			mount_component(checkbox3, target, anchor);
			insert(target, t3, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var checkbox0_changes = {};
			if (!updating_value && changed.$showNav) {
				checkbox0_changes.value = ctx.$showNav;
			}
			checkbox0.$set(checkbox0_changes);

			var checkbox1_changes = {};
			if (!updating_value_1 && changed.$elevation) {
				checkbox1_changes.value = ctx.$elevation;
			}
			checkbox1.$set(checkbox1_changes);

			var checkbox2_changes = {};
			if (!updating_value_2 && changed.$right) {
				checkbox2_changes.value = ctx.$right;
			}
			checkbox2.$set(checkbox2_changes);

			var checkbox3_changes = {};
			if (!updating_value_3 && changed.$persistent) {
				checkbox3_changes.value = ctx.$persistent;
			}
			checkbox3.$set(checkbox3_changes);

			var code_changes = {};
			if (changed.drawers) code_changes.code = drawers;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(checkbox0.$$.fragment, local);

			transition_in(checkbox1.$$.fragment, local);

			transition_in(checkbox2.$$.fragment, local);

			transition_in(checkbox3.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(checkbox0.$$.fragment, local);
			transition_out(checkbox1.$$.fragment, local);
			transition_out(checkbox2.$$.fragment, local);
			transition_out(checkbox3.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(checkbox0, detaching);

			if (detaching) {
				detach(t0);
			}

			destroy_component(checkbox1, detaching);

			if (detaching) {
				detach(t1);
			}

			destroy_component(checkbox2, detaching);

			if (detaching) {
				detach(t2);
			}

			destroy_component(checkbox3, detaching);

			if (detaching) {
				detach(t3);
			}

			destroy_component(code, detaching);
		}
	};
}

function instance$A($$self, $$props, $$invalidate) {
	let $showNav, $elevation, $right, $persistent;

	validate_store(showNav$1, 'showNav');
	subscribe($$self, showNav$1, $$value => { $showNav = $$value; $$invalidate('$showNav', $showNav); });
	validate_store(elevation$1, 'elevation');
	subscribe($$self, elevation$1, $$value => { $elevation = $$value; $$invalidate('$elevation', $elevation); });
	validate_store(right$1, 'right');
	subscribe($$self, right$1, $$value => { $right = $$value; $$invalidate('$right', $right); });
	validate_store(persistent$1, 'persistent');
	subscribe($$self, persistent$1, $$value => { $persistent = $$value; $$invalidate('$persistent', $persistent); });

	function checkbox0_value_binding(value) {
		$showNav = value;
		showNav$1.set($showNav);
	}

	function checkbox1_value_binding(value_1) {
		$elevation = value_1;
		elevation$1.set($elevation);
	}

	function checkbox2_value_binding(value_2) {
		$right = value_2;
		right$1.set($right);
	}

	function checkbox3_value_binding(value_3) {
		$persistent = value_3;
		persistent$1.set($persistent);
	}

	return {
		$showNav,
		$elevation,
		$right,
		$persistent,
		checkbox0_value_binding,
		checkbox1_value_binding,
		checkbox2_value_binding,
		checkbox3_value_binding
	};
}

class Navigation_drawers extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$A, create_fragment$H, safe_not_equal, []);
	}
}

var indicators = "<script>\n  import ProgressLinear from 'components/ProgressLinear';\n  import ProgressCircular from 'components/ProgressCircular';\n\n  import Code from 'components/Code';\n\n  let progress = 0;\n\n  function next() {\n    setTimeout(() => {\n      if (progress === 100) {\n        progress = 0;\n      }\n\n      progress += 1;\n      next();\n    }, 100);\n  }\n\n  next();\n</script>\n<h5 class=\"pb-4\">Indefinite linear progress indicator</h5>\n<ProgressLinear />\n\n<h5 class=\"pt-6 pb-4\">Definite linear progress indicator</h5>\n\n<caption class=\"mb-3\">{progress}%</caption>\n<ProgressLinear {progress} />\n\n<h5 class=\"pt-6 pb-4\">Indefinite circular progress indicator</h5>\n<ProgressCircular />\n\n<h5 class=\"pt-6 pb-4\">Definite circular progress indicator</h5>\n\n<caption class=\"mb-3\">{progress}%</caption>\n<ProgressCircular {progress} />";

/* src\routes\components\progress-indicators.svelte generated by Svelte v3.6.7 */

const file$G = "src\\routes\\components\\progress-indicators.svelte";

function create_fragment$I(ctx) {
	var h50, t1, t2, h51, t4, caption0, t5, t6, t7, t8, h52, t10, t11, h53, t13, caption1, t14, t15, t16, t17, current;

	var progresslinear0 = new ProgressLinear({ $$inline: true });

	var progresslinear1 = new ProgressLinear({
		props: { progress: ctx.progress },
		$$inline: true
	});

	var progresscircular0 = new ProgressCircular({ $$inline: true });

	var progresscircular1 = new ProgressCircular({
		props: { progress: ctx.progress },
		$$inline: true
	});

	var code = new Code({
		props: { code: indicators },
		$$inline: true
	});

	return {
		c: function create() {
			h50 = element("h5");
			h50.textContent = "Indefinite linear progress indicator";
			t1 = space();
			progresslinear0.$$.fragment.c();
			t2 = space();
			h51 = element("h5");
			h51.textContent = "Definite linear progress indicator";
			t4 = space();
			caption0 = element("caption");
			t5 = text(ctx.progress);
			t6 = text("%");
			t7 = space();
			progresslinear1.$$.fragment.c();
			t8 = space();
			h52 = element("h5");
			h52.textContent = "Indefinite circular progress indicator";
			t10 = space();
			progresscircular0.$$.fragment.c();
			t11 = space();
			h53 = element("h5");
			h53.textContent = "Definite circular progress indicator";
			t13 = space();
			caption1 = element("caption");
			t14 = text(ctx.progress);
			t15 = text("%");
			t16 = space();
			progresscircular1.$$.fragment.c();
			t17 = space();
			code.$$.fragment.c();
			attr(h50, "class", "pb-4");
			add_location(h50, file$G, 23, 0, 429);
			attr(h51, "class", "pt-6 pb-4");
			add_location(h51, file$G, 26, 0, 508);
			attr(caption0, "class", "mb-3");
			add_location(caption0, file$G, 28, 0, 571);
			attr(h52, "class", "pt-6 pb-4");
			add_location(h52, file$G, 31, 0, 646);
			attr(h53, "class", "pt-6 pb-4");
			add_location(h53, file$G, 34, 0, 734);
			attr(caption1, "class", "mb-3");
			add_location(caption1, file$G, 36, 0, 799);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h50, anchor);
			insert(target, t1, anchor);
			mount_component(progresslinear0, target, anchor);
			insert(target, t2, anchor);
			insert(target, h51, anchor);
			insert(target, t4, anchor);
			insert(target, caption0, anchor);
			append(caption0, t5);
			append(caption0, t6);
			insert(target, t7, anchor);
			mount_component(progresslinear1, target, anchor);
			insert(target, t8, anchor);
			insert(target, h52, anchor);
			insert(target, t10, anchor);
			mount_component(progresscircular0, target, anchor);
			insert(target, t11, anchor);
			insert(target, h53, anchor);
			insert(target, t13, anchor);
			insert(target, caption1, anchor);
			append(caption1, t14);
			append(caption1, t15);
			insert(target, t16, anchor);
			mount_component(progresscircular1, target, anchor);
			insert(target, t17, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (!current || changed.progress) {
				set_data(t5, ctx.progress);
			}

			var progresslinear1_changes = {};
			if (changed.progress) progresslinear1_changes.progress = ctx.progress;
			progresslinear1.$set(progresslinear1_changes);

			if (!current || changed.progress) {
				set_data(t14, ctx.progress);
			}

			var progresscircular1_changes = {};
			if (changed.progress) progresscircular1_changes.progress = ctx.progress;
			progresscircular1.$set(progresscircular1_changes);

			var code_changes = {};
			if (changed.indicators) code_changes.code = indicators;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(progresslinear0.$$.fragment, local);

			transition_in(progresslinear1.$$.fragment, local);

			transition_in(progresscircular0.$$.fragment, local);

			transition_in(progresscircular1.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(progresslinear0.$$.fragment, local);
			transition_out(progresslinear1.$$.fragment, local);
			transition_out(progresscircular0.$$.fragment, local);
			transition_out(progresscircular1.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h50);
				detach(t1);
			}

			destroy_component(progresslinear0, detaching);

			if (detaching) {
				detach(t2);
				detach(h51);
				detach(t4);
				detach(caption0);
				detach(t7);
			}

			destroy_component(progresslinear1, detaching);

			if (detaching) {
				detach(t8);
				detach(h52);
				detach(t10);
			}

			destroy_component(progresscircular0, detaching);

			if (detaching) {
				detach(t11);
				detach(h53);
				detach(t13);
				detach(caption1);
				detach(t16);
			}

			destroy_component(progresscircular1, detaching);

			if (detaching) {
				detach(t17);
			}

			destroy_component(code, detaching);
		}
	};
}

function instance$B($$self, $$props, $$invalidate) {
	

  let progress = 0;

  function next() {
    setTimeout(() => {
      if (progress === 100) {
        $$invalidate('progress', progress = 0);
      }

      $$invalidate('progress', progress += 1);
      next();
    }, 100);
  }

  next();

	return { progress };
}

class Progress_indicators extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$B, create_fragment$I, safe_not_equal, []);
	}
}

/* src\routes\components\selection-controls.svelte generated by Svelte v3.6.7 */

const file$H = "src\\routes\\components\\selection-controls.svelte";

function create_fragment$J(ctx) {
	var h50, t1, t2, t3, t4, h51, t6, t7, t8, t9, h52, t11, t12, current;

	var checkbox0 = new Checkbox({
		props: { label: "A checkbox" },
		$$inline: true
	});

	var checkbox1 = new Checkbox({
		props: {
		color: "secondary",
		label: "A colored checkbox"
	},
		$$inline: true
	});

	var checkbox2 = new Checkbox({
		props: {
		disabled: true,
		label: "A disabled checkbox"
	},
		$$inline: true
	});

	var radiobutton0 = new RadioButtonGroup({
		props: { name: "test", items: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }] },
		$$inline: true
	});

	var radiobutton1 = new RadioButtonGroup({
		props: {
		name: "Colored test",
		color: "blue",
		items: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }]
	},
		$$inline: true
	});

	var radiobutton2 = new RadioButtonGroup({
		props: {
		name: "test-disabled",
		disabled: true,
		items: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }]
	},
		$$inline: true
	});

	var switch0 = new Switch({ $$inline: true });

	var switch1 = new Switch({
		props: { color: "error" },
		$$inline: true
	});

	return {
		c: function create() {
			h50 = element("h5");
			h50.textContent = "Checkboxes";
			t1 = space();
			checkbox0.$$.fragment.c();
			t2 = space();
			checkbox1.$$.fragment.c();
			t3 = space();
			checkbox2.$$.fragment.c();
			t4 = space();
			h51 = element("h5");
			h51.textContent = "Radio buttons";
			t6 = space();
			radiobutton0.$$.fragment.c();
			t7 = space();
			radiobutton1.$$.fragment.c();
			t8 = space();
			radiobutton2.$$.fragment.c();
			t9 = space();
			h52 = element("h5");
			h52.textContent = "Switches";
			t11 = space();
			switch0.$$.fragment.c();
			t12 = space();
			switch1.$$.fragment.c();
			attr(h50, "class", "pb-8 pt-10");
			attr(h50, "id", "checkboxes");
			add_location(h50, file$H, 7, 0, 198);
			attr(h51, "class", "pb-8 pt-10");
			attr(h51, "id", "radio-buttons");
			add_location(h51, file$H, 13, 0, 395);
			attr(h52, "class", "pb-8 pt-10");
			attr(h52, "id", "switches");
			add_location(h52, file$H, 29, 0, 794);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h50, anchor);
			insert(target, t1, anchor);
			mount_component(checkbox0, target, anchor);
			insert(target, t2, anchor);
			mount_component(checkbox1, target, anchor);
			insert(target, t3, anchor);
			mount_component(checkbox2, target, anchor);
			insert(target, t4, anchor);
			insert(target, h51, anchor);
			insert(target, t6, anchor);
			mount_component(radiobutton0, target, anchor);
			insert(target, t7, anchor);
			mount_component(radiobutton1, target, anchor);
			insert(target, t8, anchor);
			mount_component(radiobutton2, target, anchor);
			insert(target, t9, anchor);
			insert(target, h52, anchor);
			insert(target, t11, anchor);
			mount_component(switch0, target, anchor);
			insert(target, t12, anchor);
			mount_component(switch1, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(checkbox0.$$.fragment, local);

			transition_in(checkbox1.$$.fragment, local);

			transition_in(checkbox2.$$.fragment, local);

			transition_in(radiobutton0.$$.fragment, local);

			transition_in(radiobutton1.$$.fragment, local);

			transition_in(radiobutton2.$$.fragment, local);

			transition_in(switch0.$$.fragment, local);

			transition_in(switch1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(checkbox0.$$.fragment, local);
			transition_out(checkbox1.$$.fragment, local);
			transition_out(checkbox2.$$.fragment, local);
			transition_out(radiobutton0.$$.fragment, local);
			transition_out(radiobutton1.$$.fragment, local);
			transition_out(radiobutton2.$$.fragment, local);
			transition_out(switch0.$$.fragment, local);
			transition_out(switch1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h50);
				detach(t1);
			}

			destroy_component(checkbox0, detaching);

			if (detaching) {
				detach(t2);
			}

			destroy_component(checkbox1, detaching);

			if (detaching) {
				detach(t3);
			}

			destroy_component(checkbox2, detaching);

			if (detaching) {
				detach(t4);
				detach(h51);
				detach(t6);
			}

			destroy_component(radiobutton0, detaching);

			if (detaching) {
				detach(t7);
			}

			destroy_component(radiobutton1, detaching);

			if (detaching) {
				detach(t8);
			}

			destroy_component(radiobutton2, detaching);

			if (detaching) {
				detach(t9);
				detach(h52);
				detach(t11);
			}

			destroy_component(switch0, detaching);

			if (detaching) {
				detach(t12);
			}

			destroy_component(switch1, detaching);
		}
	};
}

class Selection_controls extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$J, safe_not_equal, []);
	}
}

var selects = "<script>\n\timport Select from 'components/Select';\n\timport Code from 'components/Code';\n\n\tlet value1 = '';\n\tlet value2 = '';\n\tlet value3 = '';\n\n\tconst items = [\n\t\t{ value: 1, text: 'One' },\n\t\t{ value: 2, text: 'Two' }\n\t];\n\tconst label = 'A select';\n</script>\n<p>\n  One may bind to a select via\n  <span class=\"code-inline\">on:change</span>\n  event.\n</p>\n<caption>Selected: {value1 || 'nothing'}</caption>\n<Select {label} {items} on:change={v => (value1 = v.detail)} />\n\n<Code code={selects} />\n\n<p>\n  Or through binding\n  <span class=\"code-inline\">on:value</span>\n  .\n</p>\n<caption>Selected: {value2 || 'nothing'}</caption>\n<Select color=\"cyan\" bind:value={value2} {label} {items} />\n\n<p>Select may be outlined.</p>\n<Select bind:value={value2} outlined {label} {items} />\n\n<p>Select may even be an autocomplete search component.</p>\n<caption>Selected: {value3 || 'nothing'}</caption>\n<Select bind:value={value3} outlined autocomplete {label} {items} />\n";

/* src\routes\components\selects.svelte generated by Svelte v3.6.7 */

const file$I = "src\\routes\\components\\selects.svelte";

function create_fragment$K(ctx) {
	var p0, t0, span0, t2, t3, caption0, t4, t5_value = ctx.value1 || 'nothing', t5, t6, t7, t8, p1, t9, span1, t11, t12, caption1, t13, t14_value = ctx.value2 || 'nothing', t14, t15, updating_value, t16, p2, t18, updating_value_1, t19, p3, t21, caption2, t22, t23_value = ctx.value3 || 'nothing', t23, t24, updating_value_2, current;

	var select0 = new Select({
		props: { label: label, items: ctx.items },
		$$inline: true
	});
	select0.$on("change", ctx.change_handler);

	var code = new Code({
		props: { code: selects },
		$$inline: true
	});

	function select1_value_binding(value) {
		ctx.select1_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let select1_props = {
		color: "success",
		label: label,
		items: ctx.items
	};
	if (ctx.value2 !== void 0) {
		select1_props.value = ctx.value2;
	}
	var select1 = new Select({ props: select1_props, $$inline: true });

	binding_callbacks.push(() => bind(select1, 'value', select1_value_binding));

	function select2_value_binding(value_1) {
		ctx.select2_value_binding.call(null, value_1);
		updating_value_1 = true;
		add_flush_callback(() => updating_value_1 = false);
	}

	let select2_props = {
		outlined: true,
		label: label,
		items: ctx.items
	};
	if (ctx.value2 !== void 0) {
		select2_props.value = ctx.value2;
	}
	var select2 = new Select({ props: select2_props, $$inline: true });

	binding_callbacks.push(() => bind(select2, 'value', select2_value_binding));

	function select3_value_binding(value_2) {
		ctx.select3_value_binding.call(null, value_2);
		updating_value_2 = true;
		add_flush_callback(() => updating_value_2 = false);
	}

	let select3_props = {
		outlined: true,
		autocomplete: true,
		label: label,
		items: ctx.items
	};
	if (ctx.value3 !== void 0) {
		select3_props.value = ctx.value3;
	}
	var select3 = new Select({ props: select3_props, $$inline: true });

	binding_callbacks.push(() => bind(select3, 'value', select3_value_binding));

	return {
		c: function create() {
			p0 = element("p");
			t0 = text("One may bind to a select via\n  ");
			span0 = element("span");
			span0.textContent = "on:change";
			t2 = text("\n  event.");
			t3 = space();
			caption0 = element("caption");
			t4 = text("Selected: ");
			t5 = text(t5_value);
			t6 = space();
			select0.$$.fragment.c();
			t7 = space();
			code.$$.fragment.c();
			t8 = space();
			p1 = element("p");
			t9 = text("Or through binding\n  ");
			span1 = element("span");
			span1.textContent = "on:value";
			t11 = text("\n  .");
			t12 = space();
			caption1 = element("caption");
			t13 = text("Selected: ");
			t14 = text(t14_value);
			t15 = space();
			select1.$$.fragment.c();
			t16 = space();
			p2 = element("p");
			p2.textContent = "Select may be outlined.";
			t18 = space();
			select2.$$.fragment.c();
			t19 = space();
			p3 = element("p");
			p3.textContent = "Select may even be an autocomplete search component.";
			t21 = space();
			caption2 = element("caption");
			t22 = text("Selected: ");
			t23 = text(t23_value);
			t24 = space();
			select3.$$.fragment.c();
			attr(span0, "class", "code-inline");
			add_location(span0, file$I, 15, 2, 342);
			add_location(p0, file$I, 13, 0, 305);
			add_location(caption0, file$I, 18, 0, 399);
			attr(span1, "class", "code-inline");
			add_location(span1, file$I, 25, 2, 567);
			add_location(p1, file$I, 23, 0, 540);
			add_location(caption1, file$I, 28, 0, 618);
			add_location(p2, file$I, 31, 0, 733);
			add_location(p3, file$I, 34, 0, 821);
			add_location(caption2, file$I, 35, 0, 881);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, p0, anchor);
			append(p0, t0);
			append(p0, span0);
			append(p0, t2);
			insert(target, t3, anchor);
			insert(target, caption0, anchor);
			append(caption0, t4);
			append(caption0, t5);
			insert(target, t6, anchor);
			mount_component(select0, target, anchor);
			insert(target, t7, anchor);
			mount_component(code, target, anchor);
			insert(target, t8, anchor);
			insert(target, p1, anchor);
			append(p1, t9);
			append(p1, span1);
			append(p1, t11);
			insert(target, t12, anchor);
			insert(target, caption1, anchor);
			append(caption1, t13);
			append(caption1, t14);
			insert(target, t15, anchor);
			mount_component(select1, target, anchor);
			insert(target, t16, anchor);
			insert(target, p2, anchor);
			insert(target, t18, anchor);
			mount_component(select2, target, anchor);
			insert(target, t19, anchor);
			insert(target, p3, anchor);
			insert(target, t21, anchor);
			insert(target, caption2, anchor);
			append(caption2, t22);
			append(caption2, t23);
			insert(target, t24, anchor);
			mount_component(select3, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if ((!current || changed.value1) && t5_value !== (t5_value = ctx.value1 || 'nothing')) {
				set_data(t5, t5_value);
			}

			var select0_changes = {};
			if (changed.label) select0_changes.label = label;
			if (changed.items) select0_changes.items = ctx.items;
			select0.$set(select0_changes);

			var code_changes = {};
			if (changed.selects) code_changes.code = selects;
			code.$set(code_changes);

			if ((!current || changed.value2) && t14_value !== (t14_value = ctx.value2 || 'nothing')) {
				set_data(t14, t14_value);
			}

			var select1_changes = {};
			if (changed.label) select1_changes.label = label;
			if (changed.items) select1_changes.items = ctx.items;
			if (!updating_value && changed.value2) {
				select1_changes.value = ctx.value2;
			}
			select1.$set(select1_changes);

			var select2_changes = {};
			if (changed.label) select2_changes.label = label;
			if (changed.items) select2_changes.items = ctx.items;
			if (!updating_value_1 && changed.value2) {
				select2_changes.value = ctx.value2;
			}
			select2.$set(select2_changes);

			if ((!current || changed.value3) && t23_value !== (t23_value = ctx.value3 || 'nothing')) {
				set_data(t23, t23_value);
			}

			var select3_changes = {};
			if (changed.label) select3_changes.label = label;
			if (changed.items) select3_changes.items = ctx.items;
			if (!updating_value_2 && changed.value3) {
				select3_changes.value = ctx.value3;
			}
			select3.$set(select3_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(select0.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			transition_in(select1.$$.fragment, local);

			transition_in(select2.$$.fragment, local);

			transition_in(select3.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(select0.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			transition_out(select1.$$.fragment, local);
			transition_out(select2.$$.fragment, local);
			transition_out(select3.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(p0);
				detach(t3);
				detach(caption0);
				detach(t6);
			}

			destroy_component(select0, detaching);

			if (detaching) {
				detach(t7);
			}

			destroy_component(code, detaching);

			if (detaching) {
				detach(t8);
				detach(p1);
				detach(t12);
				detach(caption1);
				detach(t15);
			}

			destroy_component(select1, detaching);

			if (detaching) {
				detach(t16);
				detach(p2);
				detach(t18);
			}

			destroy_component(select2, detaching);

			if (detaching) {
				detach(t19);
				detach(p3);
				detach(t21);
				detach(caption2);
				detach(t24);
			}

			destroy_component(select3, detaching);
		}
	};
}

const label = "A select";

function instance$C($$self, $$props, $$invalidate) {
	

  let value1 = "";
  let value2 = "";
  let value3 = "";

  const items = [{ value: 1, text: "One" }, { value: 2, text: "Two" }];

	function change_handler(v) {
		const $$result = (value1 = v.detail);
		$$invalidate('value1', value1);
		return $$result;
	}

	function select1_value_binding(value) {
		value2 = value;
		$$invalidate('value2', value2);
	}

	function select2_value_binding(value_1) {
		value2 = value_1;
		$$invalidate('value2', value2);
	}

	function select3_value_binding(value_2) {
		value3 = value_2;
		$$invalidate('value3', value3);
	}

	return {
		value1,
		value2,
		value3,
		items,
		change_handler,
		select1_value_binding,
		select2_value_binding,
		select3_value_binding
	};
}

class Selects extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$C, create_fragment$K, safe_not_equal, []);
	}
}

/* src\routes\components\sliders.svelte generated by Svelte v3.6.7 */

const file$J = "src\\routes\\components\\sliders.svelte";

function create_fragment$L(ctx) {
	var div, updating_value, t0, h60, t2, caption0, t3, t4, t5, updating_value_1, t6, h61, t8, caption1, t9, t10, t11, updating_value_2, current;

	function checkbox_value_binding(value_1) {
		ctx.checkbox_value_binding.call(null, value_1);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let checkbox_props = { label: "Disabled" };
	if (ctx.disabled !== void 0) {
		checkbox_props.value = ctx.disabled;
	}
	var checkbox = new Checkbox({ props: checkbox_props, $$inline: true });

	binding_callbacks.push(() => bind(checkbox, 'value', checkbox_value_binding));

	function slider0_value_binding(value_2) {
		ctx.slider0_value_binding.call(null, value_2);
		updating_value_1 = true;
		add_flush_callback(() => updating_value_1 = false);
	}

	let slider0_props = {
		min: "0",
		max: "100",
		disabled: ctx.disabled
	};
	if (ctx.value !== void 0) {
		slider0_props.value = ctx.value;
	}
	var slider0 = new Slider({ props: slider0_props, $$inline: true });

	binding_callbacks.push(() => bind(slider0, 'value', slider0_value_binding));

	function slider1_value_binding(value_3) {
		ctx.slider1_value_binding.call(null, value_3);
		updating_value_2 = true;
		add_flush_callback(() => updating_value_2 = false);
	}

	let slider1_props = {
		min: "0",
		step: "20",
		max: "100",
		disabled: ctx.disabled
	};
	if (ctx.value2 !== void 0) {
		slider1_props.value = ctx.value2;
	}
	var slider1 = new Slider({ props: slider1_props, $$inline: true });

	binding_callbacks.push(() => bind(slider1, 'value', slider1_value_binding));

	return {
		c: function create() {
			div = element("div");
			checkbox.$$.fragment.c();
			t0 = space();
			h60 = element("h6");
			h60.textContent = "Basic";
			t2 = space();
			caption0 = element("caption");
			t3 = text("Value: ");
			t4 = text(ctx.value);
			t5 = space();
			slider0.$$.fragment.c();
			t6 = space();
			h61 = element("h6");
			h61.textContent = "With steps";
			t8 = space();
			caption1 = element("caption");
			t9 = text("Value: ");
			t10 = text(ctx.value2);
			t11 = space();
			slider1.$$.fragment.c();
			attr(div, "class", "my-4");
			add_location(div, file$J, 10, 0, 206);
			add_location(h60, file$J, 14, 0, 287);
			add_location(caption0, file$J, 16, 0, 303);
			attr(h61, "class", "mt-8");
			add_location(h61, file$J, 20, 0, 390);
			add_location(caption1, file$J, 22, 0, 424);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(checkbox, div, null);
			insert(target, t0, anchor);
			insert(target, h60, anchor);
			insert(target, t2, anchor);
			insert(target, caption0, anchor);
			append(caption0, t3);
			append(caption0, t4);
			insert(target, t5, anchor);
			mount_component(slider0, target, anchor);
			insert(target, t6, anchor);
			insert(target, h61, anchor);
			insert(target, t8, anchor);
			insert(target, caption1, anchor);
			append(caption1, t9);
			append(caption1, t10);
			insert(target, t11, anchor);
			mount_component(slider1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var checkbox_changes = {};
			if (!updating_value && changed.disabled) {
				checkbox_changes.value = ctx.disabled;
			}
			checkbox.$set(checkbox_changes);

			if (!current || changed.value) {
				set_data(t4, ctx.value);
			}

			var slider0_changes = {};
			if (changed.disabled) slider0_changes.disabled = ctx.disabled;
			if (!updating_value_1 && changed.value) {
				slider0_changes.value = ctx.value;
			}
			slider0.$set(slider0_changes);

			if (!current || changed.value2) {
				set_data(t10, ctx.value2);
			}

			var slider1_changes = {};
			if (changed.disabled) slider1_changes.disabled = ctx.disabled;
			if (!updating_value_2 && changed.value2) {
				slider1_changes.value = ctx.value2;
			}
			slider1.$set(slider1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(checkbox.$$.fragment, local);

			transition_in(slider0.$$.fragment, local);

			transition_in(slider1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(checkbox.$$.fragment, local);
			transition_out(slider0.$$.fragment, local);
			transition_out(slider1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(checkbox, );

			if (detaching) {
				detach(t0);
				detach(h60);
				detach(t2);
				detach(caption0);
				detach(t5);
			}

			destroy_component(slider0, detaching);

			if (detaching) {
				detach(t6);
				detach(h61);
				detach(t8);
				detach(caption1);
				detach(t11);
			}

			destroy_component(slider1, detaching);
		}
	};
}

function instance$D($$self, $$props, $$invalidate) {
	

  let value = 0;
  let value2 = 0;
  let disabled = false;

	function checkbox_value_binding(value_1) {
		disabled = value_1;
		$$invalidate('disabled', disabled);
	}

	function slider0_value_binding(value_2) {
		value = value_2;
		$$invalidate('value', value);
	}

	function slider1_value_binding(value_3) {
		value2 = value_3;
		$$invalidate('value2', value2);
	}

	return {
		value,
		value2,
		disabled,
		checkbox_value_binding,
		slider0_value_binding,
		slider1_value_binding
	};
}

class Sliders extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$D, create_fragment$L, safe_not_equal, []);
	}
}

var snakebars = "<script>\n\timport Snackbar from 'components/Snackbar';\n\timport Button from 'components/Button';\n    \n  let showSnackbar = false;\n</script>\n\n<Snackbar bind:value={showSnackbar}>\n  <div>Have a nice day.</div>\n  <div slot=\"action\">\n    <Button text on:click={() => showSnackbar = false}>Dismiss</Button>\n  </div>\n</Snackbar>\n\n<div class=\"py-2\">\n  <Button on:click={() => showSnackbar = true}>Show snackbar</Button>\n</div>";

/* src\routes\components\snackbars.svelte generated by Svelte v3.6.7 */

const file$K = "src\\routes\\components\\snackbars.svelte";

// (13:4) <Button text on:click={() => (showSnackbar = false)}>
function create_default_slot_2$6(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Dismiss");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (12:2) <div slot="action">
function create_action_slot$1(ctx) {
	var div, current;

	var button = new Button({
		props: {
		text: true,
		$$slots: { default: [create_default_slot_2$6] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler);

	return {
		c: function create() {
			div = element("div");
			button.$$.fragment.c();
			attr(div, "slot", "action");
			add_location(div, file$K, 11, 2, 294);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(button, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(button, );
		}
	};
}

// (10:0) <Snackbar bind:value={showSnackbar}>
function create_default_slot_1$a(ctx) {
	var div, t_1;

	return {
		c: function create() {
			div = element("div");
			div.textContent = "Have a nice day.";
			t_1 = space();
			add_location(div, file$K, 10, 2, 264);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			insert(target, t_1, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
				detach(t_1);
			}
		}
	};
}

// (18:2) <Button on:click={() => (showSnackbar = true)}>
function create_default_slot$h(ctx) {
	var t;

	return {
		c: function create() {
			t = text("Show snackbar");
		},

		m: function mount(target, anchor) {
			insert(target, t, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

function create_fragment$M(ctx) {
	var updating_value, t0, div, t1, current;

	function snackbar_value_binding(value) {
		ctx.snackbar_value_binding.call(null, value);
		updating_value = true;
		add_flush_callback(() => updating_value = false);
	}

	let snackbar_props = {
		$$slots: {
		default: [create_default_slot_1$a],
		action: [create_action_slot$1]
	},
		$$scope: { ctx }
	};
	if (ctx.showSnackbar !== void 0) {
		snackbar_props.value = ctx.showSnackbar;
	}
	var snackbar = new Snackbar({ props: snackbar_props, $$inline: true });

	binding_callbacks.push(() => bind(snackbar, 'value', snackbar_value_binding));

	var button = new Button({
		props: {
		$$slots: { default: [create_default_slot$h] },
		$$scope: { ctx }
	},
		$$inline: true
	});
	button.$on("click", ctx.click_handler_1);

	var code = new Code({
		props: { code: snakebars },
		$$inline: true
	});

	return {
		c: function create() {
			snackbar.$$.fragment.c();
			t0 = space();
			div = element("div");
			button.$$.fragment.c();
			t1 = space();
			code.$$.fragment.c();
			attr(div, "class", "py-2");
			add_location(div, file$K, 16, 0, 410);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			mount_component(snackbar, target, anchor);
			insert(target, t0, anchor);
			insert(target, div, anchor);
			mount_component(button, div, null);
			insert(target, t1, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var snackbar_changes = {};
			if (changed.$$scope) snackbar_changes.$$scope = { changed, ctx };
			if (!updating_value && changed.showSnackbar) {
				snackbar_changes.value = ctx.showSnackbar;
			}
			snackbar.$set(snackbar_changes);

			var button_changes = {};
			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
			button.$set(button_changes);

			var code_changes = {};
			if (changed.snakebars) code_changes.code = snakebars;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(snackbar.$$.fragment, local);

			transition_in(button.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(snackbar.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(snackbar, detaching);

			if (detaching) {
				detach(t0);
				detach(div);
			}

			destroy_component(button, );

			if (detaching) {
				detach(t1);
			}

			destroy_component(code, detaching);
		}
	};
}

function instance$E($$self, $$props, $$invalidate) {
	

  let showSnackbar = false;

	function click_handler() {
		const $$result = (showSnackbar = false);
		$$invalidate('showSnackbar', showSnackbar);
		return $$result;
	}

	function snackbar_value_binding(value) {
		showSnackbar = value;
		$$invalidate('showSnackbar', showSnackbar);
	}

	function click_handler_1() {
		const $$result = (showSnackbar = true);
		$$invalidate('showSnackbar', showSnackbar);
		return $$result;
	}

	return {
		showSnackbar,
		click_handler,
		snackbar_value_binding,
		click_handler_1
	};
}

class Snackbars extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$E, create_fragment$M, safe_not_equal, []);
	}
}

var tabs = "<script>\n  import { stores } from '@sapper/app';\n  const { page } = stores();\n\n  const topMenu = [\n      { to: '/components', text: 'Components' },\n      { to: '/typography', text: 'Typography' },\n      { to: '/color', text: 'Color' },\n    ];\n\n  // Or simply use document.location.pathname\n  // if your app isn't sapper.\n  $: path = $page.path;\n</script>\n\n<Tabs items={topMenu} bind:selected={path} />";

var tabsWithContent = "<div style=\"max-width: 400px\">\n  <Tabs\n    selected=\"1\"\n    c=\"bg-black elevation-10 mt-6 text-white rounded-t-lg\"\n    color=\"yellow-a200\"\n    let:selected={selected}\n    {loading}\n    items={[\n      { id: \"1\", text: 'Cats', icon: 'alarm_on' },\n      { id: \"2\", text: 'Kittens', icon: 'bug_report' },\n      { id: \"3\", text: 'Kitties', icon: 'eject' },\n    ]}>\n    <div\n      slot=\"content\"\n      class=\"flex items-center content-center overflow-hidden w-full bg-gray-900 h-full\"\n      style=\"height: 250px\"\n    >\n      <Tab id=\"1\" {selected}>\n        <Image\n          alt=\"kitten 1\"\n          c=\"w-full\"\n          src=\"https://placekitten.com/400/250\"\n          width=\"400\"\n          height=\"250\"\n        />\n      </Tab>\n      <Tab id=\"2\" {selected}>\n        <Image\n          alt=\"kitten 1\"\n          c=\"w-full\"\n          src=\"https://placekitten.com/400/251\"\n          width=\"400\"\n          height=\"250\"\n        />\n      </Tab>\n        <Tab id=\"3\" {selected}>\n        <Image\n          alt=\"kitten 3\"\n          c=\"w-full\"\n          src=\"https://placekitten.com/400/253\"\n          width=\"400\"\n          height=\"250\"\n        />\n      </Tab>\n  </Tabs>\n</div>";

/* src\routes\components\tabs.svelte generated by Svelte v3.6.7 */

const file$L = "src\\routes\\components\\tabs.svelte";

// (40:6) <Tab id="1" {selected}>
function create_default_slot_3$3(ctx) {
	var current;

	var image = new Image_1({
		props: {
		alt: "kitten 1",
		c: "w-full",
		src: "https://placekitten.com/400/250",
		width: "400",
		height: "250"
	},
		$$inline: true
	});

	return {
		c: function create() {
			image.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(image, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(image.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(image.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(image, detaching);
		}
	};
}

// (48:6) <Tab id="2" {selected}>
function create_default_slot_2$7(ctx) {
	var current;

	var image = new Image_1({
		props: {
		alt: "kitten 1",
		c: "w-full",
		src: "https://placekitten.com/400/251",
		width: "400",
		height: "250"
	},
		$$inline: true
	});

	return {
		c: function create() {
			image.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(image, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(image.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(image.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(image, detaching);
		}
	};
}

// (56:6) <Tab id="3" {selected}>
function create_default_slot_1$b(ctx) {
	var current;

	var image = new Image_1({
		props: {
		alt: "kitten 3",
		c: "w-full",
		src: "https://placekitten.com/400/253",
		width: "400",
		height: "250"
	},
		$$inline: true
	});

	return {
		c: function create() {
			image.$$.fragment.c();
		},

		m: function mount(target, anchor) {
			mount_component(image, target, anchor);
			current = true;
		},

		p: noop,

		i: function intro(local) {
			if (current) return;
			transition_in(image.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(image.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			destroy_component(image, detaching);
		}
	};
}

// (35:4) <div       slot="content"       class="flex items-center content-center overflow-hidden w-full bg-gray-900       h-full"       style="height: 250px">
function create_content_slot(ctx) {
	var div, t0, t1, current;

	var tab0 = new Tab({
		props: {
		id: "1",
		selected: ctx.selected,
		$$slots: { default: [create_default_slot_3$3] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var tab1 = new Tab({
		props: {
		id: "2",
		selected: ctx.selected,
		$$slots: { default: [create_default_slot_2$7] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var tab2 = new Tab({
		props: {
		id: "3",
		selected: ctx.selected,
		$$slots: { default: [create_default_slot_1$b] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			div = element("div");
			tab0.$$.fragment.c();
			t0 = space();
			tab1.$$.fragment.c();
			t1 = space();
			tab2.$$.fragment.c();
			attr(div, "slot", "content");
			attr(div, "class", "flex items-center content-center overflow-hidden w-full bg-gray-900\n      h-full");
			set_style(div, "height", "250px");
			add_location(div, file$L, 34, 4, 1080);
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);
			mount_component(tab0, div, null);
			append(div, t0);
			mount_component(tab1, div, null);
			append(div, t1);
			mount_component(tab2, div, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var tab0_changes = {};
			if (changed.selected) tab0_changes.selected = ctx.selected;
			if (changed.$$scope) tab0_changes.$$scope = { changed, ctx };
			tab0.$set(tab0_changes);

			var tab1_changes = {};
			if (changed.selected) tab1_changes.selected = ctx.selected;
			if (changed.$$scope) tab1_changes.$$scope = { changed, ctx };
			tab1.$set(tab1_changes);

			var tab2_changes = {};
			if (changed.selected) tab2_changes.selected = ctx.selected;
			if (changed.$$scope) tab2_changes.$$scope = { changed, ctx };
			tab2.$set(tab2_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(tab0.$$.fragment, local);

			transition_in(tab1.$$.fragment, local);

			transition_in(tab2.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(tab0.$$.fragment, local);
			transition_out(tab1.$$.fragment, local);
			transition_out(tab2.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(tab0, );

			destroy_component(tab1, );

			destroy_component(tab2, );
		}
	};
}

// (28:2) <Tabs     selected="1"     c="bg-black elevation-10 mt-6 text-white rounded-t-lg"     color="secondary"     let:selected     {loading}     items={[{ id: '1', text: 'Cats', icon: 'alarm_on' }, { id: '2', text: 'Kittens', icon: 'bug_report' }, { id: '3', text: 'Kitties', icon: 'eject' }]}>
function create_default_slot$i(ctx) {

	return {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
}

function create_fragment$N(ctx) {
	var p, t1, t2, blockquote, t4, div, t5, current;

	var code0 = new Code({
		props: { code: tabs },
		$$inline: true
	});

	var tabs_1 = new Tabs({
		props: {
		selected: "1",
		c: "bg-black elevation-10 mt-6 text-white rounded-t-lg",
		color: "secondary",
		loading: loading,
		items: [{ id: '1', text: 'Cats', icon: 'alarm_on' }, { id: '2', text: 'Kittens', icon: 'bug_report' }, { id: '3', text: 'Kitties', icon: 'eject' }],
		$$slots: {
		default: [create_default_slot$i, ({ selected }) => ({ selected })],
		content: [create_content_slot, ({ selected }) => ({ selected })]
	},
		$$scope: { ctx }
	},
		$$inline: true
	});

	var code1 = new Code({
		props: { code: tabsWithContent },
		$$inline: true
	});

	return {
		c: function create() {
			p = element("p");
			p.textContent = "Tabs can be used as navigation elements like the ones you see on the top\n  right. You need to bind current pathname as value prop for active indicator to\n  work correctly.";
			t1 = space();
			code0.$$.fragment.c();
			t2 = space();
			blockquote = element("blockquote");
			blockquote.textContent = "Tabs organize and allow navigation between groups of content that are related\n  and at the same level of hierarchy.";
			t4 = space();
			div = element("div");
			tabs_1.$$.fragment.c();
			t5 = space();
			code1.$$.fragment.c();
			add_location(p, file$L, 11, 0, 274);
			attr(blockquote, "class", "pl-8 mt-16 mb-10 border-l-8 border-primary-300 text-lg");
			attr(blockquote, "cite", "https://material.io/design/components/tabs.html#usage");
			add_location(blockquote, file$L, 19, 0, 480);
			set_style(div, "max-width", "400px");
			add_location(div, file$L, 26, 0, 754);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, p, anchor);
			insert(target, t1, anchor);
			mount_component(code0, target, anchor);
			insert(target, t2, anchor);
			insert(target, blockquote, anchor);
			insert(target, t4, anchor);
			insert(target, div, anchor);
			mount_component(tabs_1, div, null);
			insert(target, t5, anchor);
			mount_component(code1, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var code0_changes = {};
			if (changed.tabs) code0_changes.code = tabs;
			code0.$set(code0_changes);

			var tabs_1_changes = {};
			if (changed.loading) tabs_1_changes.loading = loading;
			if (changed.$$scope) tabs_1_changes.$$scope = { changed, ctx };
			tabs_1.$set(tabs_1_changes);

			var code1_changes = {};
			if (changed.tabsWithContent) code1_changes.code = tabsWithContent;
			code1.$set(code1_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(code0.$$.fragment, local);

			transition_in(tabs_1.$$.fragment, local);

			transition_in(code1.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(code0.$$.fragment, local);
			transition_out(tabs_1.$$.fragment, local);
			transition_out(code1.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(p);
				detach(t1);
			}

			destroy_component(code0, detaching);

			if (detaching) {
				detach(t2);
				detach(blockquote);
				detach(t4);
				detach(div);
			}

			destroy_component(tabs_1, );

			if (detaching) {
				detach(t5);
			}

			destroy_component(code1, detaching);
		}
	};
}

let loading = false;

class Tabs_1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$N, safe_not_equal, []);
	}
}

var textFields = "<script>\n\timport TextField from 'components/TextField';\n</script>\n\n<h6 class=\"mb-3 mt-6\">Basic</h6>\n<TextField label=\"Test label\" />\n\n<h6 class=\"mb-3 mt-6\">With hint</h6>\n<TextField label=\"Test label\" hint=\"Test hint\" persistentHint />\n\n<h6 class=\"mb-3 mt-6\">With error</h6>\n<TextField label=\"Test label\" error=\"Test error\" />\n\n<h6 class=\"mb-3 mt-6\">Outlined</h6>\n<TextField label=\"Test label\" outlined />\n\n<h6 class=\"mb-3 mt-6\">Outlined with hint</h6>\n<TextField label=\"Test label\" outlined hint=\"Test hint\" />\n\n<h6 class=\"mb-3 mt-6\">Outlined with error</h6>\n<TextField label=\"Test label\" outlined error=\"Test error\" />\n\n<h6 class=\"mb-3 mt-6\">Outlined textarea</h6>\n<TextField label=\"Test label\" textarea rows=5 outlined />";

/* src\routes\components\text-fields.svelte generated by Svelte v3.6.7 */

const file$M = "src\\routes\\components\\text-fields.svelte";

function create_fragment$O(ctx) {
	var h60, t1, t2, h61, t4, t5, h62, t7, t8, h63, t10, t11, h64, t13, t14, h65, t16, t17, h66, t19, t20, current;

	var textfield0 = new TextField({
		props: { label: "Test label" },
		$$inline: true
	});

	var textfield1 = new TextField({
		props: {
		label: "Test label",
		hint: "Test hint",
		persistentHint: true,
		color: "blue"
	},
		$$inline: true
	});

	var textfield2 = new TextField({
		props: { label: "Test label", error: "Test error" },
		$$inline: true
	});

	var textfield3 = new TextField({
		props: { label: "Test label", outlined: true },
		$$inline: true
	});

	var textfield4 = new TextField({
		props: {
		label: "Test label",
		outlined: true,
		hint: "Test hint"
	},
		$$inline: true
	});

	var textfield5 = new TextField({
		props: {
		label: "Test label",
		outlined: true,
		error: "Test error"
	},
		$$inline: true
	});

	var textfield6 = new TextField({
		props: {
		label: "Test label",
		textarea: true,
		rows: "5",
		outlined: true
	},
		$$inline: true
	});

	var code = new Code({
		props: { code: textFields },
		$$inline: true
	});

	return {
		c: function create() {
			h60 = element("h6");
			h60.textContent = "Basic";
			t1 = space();
			textfield0.$$.fragment.c();
			t2 = space();
			h61 = element("h6");
			h61.textContent = "With hint";
			t4 = space();
			textfield1.$$.fragment.c();
			t5 = space();
			h62 = element("h6");
			h62.textContent = "With error";
			t7 = space();
			textfield2.$$.fragment.c();
			t8 = space();
			h63 = element("h6");
			h63.textContent = "Outlined";
			t10 = space();
			textfield3.$$.fragment.c();
			t11 = space();
			h64 = element("h6");
			h64.textContent = "Outlined with hint";
			t13 = space();
			textfield4.$$.fragment.c();
			t14 = space();
			h65 = element("h6");
			h65.textContent = "Outlined with error";
			t16 = space();
			textfield5.$$.fragment.c();
			t17 = space();
			h66 = element("h6");
			h66.textContent = "Outlined textarea";
			t19 = space();
			textfield6.$$.fragment.c();
			t20 = space();
			code.$$.fragment.c();
			attr(h60, "class", "mb-3 mt-6");
			add_location(h60, file$M, 7, 0, 160);
			attr(h61, "class", "mb-3 mt-6");
			add_location(h61, file$M, 9, 0, 226);
			attr(h62, "class", "mb-3 mt-6");
			add_location(h62, file$M, 11, 0, 341);
			attr(h63, "class", "mb-3 mt-6");
			add_location(h63, file$M, 13, 0, 431);
			attr(h64, "class", "mb-3 mt-6");
			add_location(h64, file$M, 15, 0, 509);
			attr(h65, "class", "mb-3 mt-6");
			add_location(h65, file$M, 17, 0, 614);
			attr(h66, "class", "mb-3 mt-6");
			add_location(h66, file$M, 19, 0, 722);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, h60, anchor);
			insert(target, t1, anchor);
			mount_component(textfield0, target, anchor);
			insert(target, t2, anchor);
			insert(target, h61, anchor);
			insert(target, t4, anchor);
			mount_component(textfield1, target, anchor);
			insert(target, t5, anchor);
			insert(target, h62, anchor);
			insert(target, t7, anchor);
			mount_component(textfield2, target, anchor);
			insert(target, t8, anchor);
			insert(target, h63, anchor);
			insert(target, t10, anchor);
			mount_component(textfield3, target, anchor);
			insert(target, t11, anchor);
			insert(target, h64, anchor);
			insert(target, t13, anchor);
			mount_component(textfield4, target, anchor);
			insert(target, t14, anchor);
			insert(target, h65, anchor);
			insert(target, t16, anchor);
			mount_component(textfield5, target, anchor);
			insert(target, t17, anchor);
			insert(target, h66, anchor);
			insert(target, t19, anchor);
			mount_component(textfield6, target, anchor);
			insert(target, t20, anchor);
			mount_component(code, target, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var code_changes = {};
			if (changed.textFields) code_changes.code = textFields;
			code.$set(code_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(textfield0.$$.fragment, local);

			transition_in(textfield1.$$.fragment, local);

			transition_in(textfield2.$$.fragment, local);

			transition_in(textfield3.$$.fragment, local);

			transition_in(textfield4.$$.fragment, local);

			transition_in(textfield5.$$.fragment, local);

			transition_in(textfield6.$$.fragment, local);

			transition_in(code.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(textfield0.$$.fragment, local);
			transition_out(textfield1.$$.fragment, local);
			transition_out(textfield2.$$.fragment, local);
			transition_out(textfield3.$$.fragment, local);
			transition_out(textfield4.$$.fragment, local);
			transition_out(textfield5.$$.fragment, local);
			transition_out(textfield6.$$.fragment, local);
			transition_out(code.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h60);
				detach(t1);
			}

			destroy_component(textfield0, detaching);

			if (detaching) {
				detach(t2);
				detach(h61);
				detach(t4);
			}

			destroy_component(textfield1, detaching);

			if (detaching) {
				detach(t5);
				detach(h62);
				detach(t7);
			}

			destroy_component(textfield2, detaching);

			if (detaching) {
				detach(t8);
				detach(h63);
				detach(t10);
			}

			destroy_component(textfield3, detaching);

			if (detaching) {
				detach(t11);
				detach(h64);
				detach(t13);
			}

			destroy_component(textfield4, detaching);

			if (detaching) {
				detach(t14);
				detach(h65);
				detach(t16);
			}

			destroy_component(textfield5, detaching);

			if (detaching) {
				detach(t17);
				detach(h66);
				detach(t19);
			}

			destroy_component(textfield6, detaching);

			if (detaching) {
				detach(t20);
			}

			destroy_component(code, detaching);
		}
	};
}

class Text_fields extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, null, create_fragment$O, safe_not_equal, []);
	}
}

function convert (str, loose) {
	if (str instanceof RegExp) return { keys:false, pattern:str };
	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
	arr[0] || arr.shift();

	while (tmp = arr.shift()) {
		c = tmp[0];
		if (c === '*') {
			keys.push('wild');
			pattern += '/(.*)';
		} else if (c === ':') {
			o = tmp.indexOf('?', 1);
			ext = tmp.indexOf('.', 1);
			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
		} else {
			pattern += '/' + tmp;
		}
	}

	return {
		keys: keys,
		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
	};
}

function Navaid(base, on404) {
	var rgx, routes=[], $={};

	var fmt = $.format = function (uri) {
		if (!uri) return uri;
		uri = '/' + uri.replace(/^\/|\/$/g, '');
		return rgx.test(uri) && uri.replace(rgx, '/');
	};

	base = '/' + (base || '').replace(/^\/|\/$/g, '');
	rgx = base == '/' ? /^\/+/ : new RegExp('^\\' + base + '(?=\\/|$)\\/?', 'i');

	$.route = function (uri, replace) {
		if (uri[0] == '/' && !rgx.test(uri)) uri = base + uri;
		history[(replace ? 'replace' : 'push') + 'State'](uri, null, uri);
	};

	$.on = function (pat, fn) {
		(pat = convert(pat)).fn = fn;
		routes.push(pat);
		return $;
	};

	$.run = function (uri) {
		var i=0, params={}, arr, obj;
		if (uri = fmt(uri || location.pathname)) {
			uri = uri.match(/[^\?#]*/)[0];
			for (; i < routes.length; i++) {
				if (arr = (obj=routes[i]).pattern.exec(uri)) {
					for (i=0; i < obj.keys.length;) {
						params[obj.keys[i]] = arr[++i] || null;
					}
					obj.fn(params); // todo loop?
					return $;
				}
			}
			if (on404) on404(uri);
		}
		return $;
	};

	$.listen = function () {
		wrap('push');
		wrap('replace');

		function run(e) {
			$.run();
		}

		function click(e) {
			var x = e.target.closest('a'), y = x && x.getAttribute('href');
			if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button || e.defaultPrevented) return;
			if (!y || x.target || x.host !== location.host) return;
			if (y[0] != '/' || rgx.test(y)) {
				e.preventDefault();
				$.route(y);
			}
		}

		addEventListener('popstate', run);
		addEventListener('replacestate', run);
		addEventListener('pushstate', run);
		addEventListener('click', click);

		$.unlisten = function () {
			removeEventListener('popstate', run);
			removeEventListener('replacestate', run);
			removeEventListener('pushstate', run);
			removeEventListener('click', click);
		};

		return $.run();
	};

	return $;
}

function wrap(type, fn) {
	if (history[type]) return;
	history[type] = type;
	fn = history[type += 'State'];
	history[type] = function (uri) {
		var ev = new Event(type.toLowerCase());
		ev.uri = uri;
		fn.apply(this, arguments);
		return dispatchEvent(ev);
	};
}

const menu1 = [
  { to: "/components/text-fields", text: "Text fields", component: Text_fields },
  { to: "/components/buttons", text: "Buttons", component: Buttons },
  { to: "/components/selection-controls", text: "Selection controls", component: Selection_controls },
  { to: "/components/lists", text: "Lists", component: Text_fields },
  { to: "/components/selects", text: "Selects", component: Selects },
  { to: "/components/snackbars", text: "Snackbars", component: Snackbars },
  { to: "/components/dialogs", text: "Dialogs", component: Dialogs },
  { to: "/components/navigation-drawers", text: "Navigation drawers", component: Navigation_drawers },
  { to: "/components/progress-indicators", text: "Progress indicators", component: Progress_indicators },
  { to: "/components/chips", text: "Chips", component: Chips },
  { to: "/components/tabs", text: "Tabs", component: Tabs_1 },
  { to: "/components/cards", text: "Cards", component: Cards },
  { to: "/components/menus", text: "Menus", component: Menus },
  { to: "/components/images", text: "Images", component: Images },
  { to: "/components/sliders", text: "Sliders", component: Sliders },
  { to: "/components/data-tables", text: "DataTables", component: Data_tables },
];

const menu2 = [
  { to: "/typography", text: "Typography" },
  { to: "/color", text: "Color" }
];

const topMenu = [
  { to: "/components", text: "Components" },
  { to: "/typography", text: "Typography" },
  { to: "/color", text: "Color" }
];

/* src\AppRouter.svelte generated by Svelte v3.6.7 */
const { console: console_1 } = globals;

const file$N = "src\\AppRouter.svelte";

function create_fragment$P(ctx) {
	var div, current;

	var switch_value = ctx.Route;

	function switch_props(ctx) {
		return {
			props: { params: ctx.params },
			$$inline: true
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c: function create() {
			div = element("div");
			if (switch_instance) switch_instance.$$.fragment.c();
			add_location(div, file$N, 39, 0, 939);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, div, anchor);

			if (switch_instance) {
				mount_component(switch_instance, div, null);
			}

			current = true;
		},

		p: function update(changed, ctx) {
			var switch_instance_changes = {};
			if (changed.params) switch_instance_changes.params = ctx.params;

			if (switch_value !== (switch_value = ctx.Route)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;
					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});
					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));

					switch_instance.$$.fragment.c();
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, div, null);
				} else {
					switch_instance = null;
				}
			}

			else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},

		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(div);
			}

			if (switch_instance) destroy_component(switch_instance, );
		}
	};
}

function instance$F($$self, $$props, $$invalidate) {
	

	let Route, params;
	let { path = '' } = $$props;
  
  function findComponent(obj) {
    const key = `/components/${obj ? obj.id : ''}`;
    const item = menu1.find(x => x.to === key);
    if (item) {
      $$invalidate('Route', Route = item.component);
      // console.log('Route', Route);
    } else {
      $$invalidate('Route', Route = Index);
      console.log('Index', Route);
    }
  }

	const router = Navaid('/')
		.on('/', () => { const $$result = Route = Home; $$invalidate('Route', Route); return $$result; })
		.on('/color', () => { const $$result = Route = Color; $$invalidate('Route', Route); return $$result; })
    .on('/typography', () => { const $$result = Route = Typography; $$invalidate('Route', Route); return $$result; })
    .on('/components', () => findComponent())
		.on('/components/:id', obj => findComponent(obj))
		.listen();

	onDestroy(router.unlisten);

	const writable_props = ['path'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<AppRouter> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('path' in $$props) $$invalidate('path', path = $$props.path);
	};

	$$self.$$.update = ($$dirty = { Route: 1 }) => {
		if ($$dirty.Route) { {
        if (Route) {
          $$invalidate('path', path = window.location.pathname);
        }
      } }
	};

	return { Route, params, path };
}

class AppRouter extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$F, create_fragment$P, safe_not_equal, ["path"]);
	}

	get path() {
		throw new Error("<AppRouter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set path(value) {
		throw new Error("<AppRouter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src\App.svelte generated by Svelte v3.6.7 */

const file$O = "src\\App.svelte";

function get_each_context$5(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.link = list[i];
	return child_ctx;
}

// (45:0) {#each menu as link}
function create_each_block$5(ctx) {
	var a, t_value = ctx.link.text, t, a_href_value;

	return {
		c: function create() {
			a = element("a");
			t = text(t_value);
			attr(a, "href", a_href_value = ctx.link.to);
			attr(a, "class", "hidden");
			add_location(a, file$O, 45, 2, 1174);
		},

		m: function mount(target, anchor) {
			insert(target, a, anchor);
			append(a, t);
		},

		p: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(a);
			}
		}
	};
}

// (49:0) <AppBar>
function create_default_slot_2$8(ctx) {
	var a0, img0, t0, h6, t2, t3, updating_selected, t4, div, t5, a1, img1, current;

	var spacer = new Spacer$1({ $$inline: true });

	function tabs_selected_binding(value) {
		ctx.tabs_selected_binding.call(null, value);
		updating_selected = true;
		add_flush_callback(() => updating_selected = false);
	}

	let tabs_props = { navigation: true, items: topMenu };
	if (ctx.path !== void 0) {
		tabs_props.selected = ctx.path;
	}
	var tabs = new Tabs({ props: tabs_props, $$inline: true });

	binding_callbacks.push(() => bind(tabs, 'selected', tabs_selected_binding));

	var button = new Button({
		props: { icon: "menu", small: true, text: true },
		$$inline: true
	});
	button.$on("click", ctx.click_handler);

	return {
		c: function create() {
			a0 = element("a");
			img0 = element("img");
			t0 = space();
			h6 = element("h6");
			h6.textContent = "SMELTE";
			t2 = space();
			spacer.$$.fragment.c();
			t3 = space();
			tabs.$$.fragment.c();
			t4 = space();
			div = element("div");
			button.$$.fragment.c();
			t5 = space();
			a1 = element("a");
			img1 = element("img");
			attr(img0, "src", "/logo.png");
			attr(img0, "alt", "Smelte logo");
			attr(img0, "width", "44");
			add_location(img0, file$O, 50, 4, 1299);
			attr(h6, "class", "pl-3 text-white tracking-widest font-thin text-lg");
			add_location(h6, file$O, 51, 4, 1356);
			attr(a0, "href", ".");
			attr(a0, "class", "px-2 md:px-8 flex items-center");
			add_location(a0, file$O, 49, 2, 1243);
			attr(div, "class", "md:hidden");
			add_location(div, file$O, 55, 2, 1511);
			attr(img1, "src", "/github.png");
			attr(img1, "alt", "Github Smelte");
			attr(img1, "width", "24");
			attr(img1, "height", "24");
			add_location(img1, file$O, 63, 4, 1723);
			attr(a1, "href", "https://github.com/matyunya/smelte");
			attr(a1, "class", "px-4");
			add_location(a1, file$O, 62, 2, 1660);
		},

		m: function mount(target, anchor) {
			insert(target, a0, anchor);
			append(a0, img0);
			append(a0, t0);
			append(a0, h6);
			insert(target, t2, anchor);
			mount_component(spacer, target, anchor);
			insert(target, t3, anchor);
			mount_component(tabs, target, anchor);
			insert(target, t4, anchor);
			insert(target, div, anchor);
			mount_component(button, div, null);
			insert(target, t5, anchor);
			insert(target, a1, anchor);
			append(a1, img1);
			current = true;
		},

		p: function update(changed, ctx) {
			var tabs_changes = {};
			if (changed.topMenu) tabs_changes.items = topMenu;
			if (!updating_selected && changed.path) {
				tabs_changes.selected = ctx.path;
			}
			tabs.$set(tabs_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(spacer.$$.fragment, local);

			transition_in(tabs.$$.fragment, local);

			transition_in(button.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(spacer.$$.fragment, local);
			transition_out(tabs.$$.fragment, local);
			transition_out(button.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(a0);
				detach(t2);
			}

			destroy_component(spacer, detaching);

			if (detaching) {
				detach(t3);
			}

			destroy_component(tabs, detaching);

			if (detaching) {
				detach(t4);
				detach(div);
			}

			destroy_component(button, );

			if (detaching) {
				detach(t5);
				detach(a1);
			}
		}
	};
}

// (68:0) {#if $bp}
function create_if_block$i(ctx) {
	var main, updating_showDesktop, updating_showMobile, t, updating_path, main_transition, current;

	function navigationdrawer_showDesktop_binding(value) {
		ctx.navigationdrawer_showDesktop_binding.call(null, value);
		updating_showDesktop = true;
		add_flush_callback(() => updating_showDesktop = false);
	}

	function navigationdrawer_showMobile_binding(value_1) {
		ctx.navigationdrawer_showMobile_binding.call(null, value_1);
		updating_showMobile = true;
		add_flush_callback(() => updating_showMobile = false);
	}

	let navigationdrawer_props = {
		right: ctx.$right,
		persistent: ctx.$persistent,
		elevation: ctx.$elevation,
		breakpoint: ctx.$bp,
		$$slots: { default: [create_default_slot$j] },
		$$scope: { ctx }
	};
	if (ctx.$showNav !== void 0) {
		navigationdrawer_props.showDesktop = ctx.$showNav;
	}
	if (ctx.$showNavMobile !== void 0) {
		navigationdrawer_props.showMobile = ctx.$showNavMobile;
	}
	var navigationdrawer = new NavigationDrawer({
		props: navigationdrawer_props,
		$$inline: true
	});

	binding_callbacks.push(() => bind(navigationdrawer, 'showDesktop', navigationdrawer_showDesktop_binding));
	binding_callbacks.push(() => bind(navigationdrawer, 'showMobile', navigationdrawer_showMobile_binding));

	function approuter_path_binding(value_2) {
		ctx.approuter_path_binding.call(null, value_2);
		updating_path = true;
		add_flush_callback(() => updating_path = false);
	}

	let approuter_props = {};
	if (ctx.path !== void 0) {
		approuter_props.path = ctx.path;
	}
	var approuter = new AppRouter({ props: approuter_props, $$inline: true });

	binding_callbacks.push(() => bind(approuter, 'path', approuter_path_binding));

	return {
		c: function create() {
			main = element("main");
			navigationdrawer.$$.fragment.c();
			t = space();
			approuter.$$.fragment.c();
			attr(main, "class", "container relative p-8 lg:max-w-3xl lg:ml-64 mx-auto mb-10 mt-24\n    md:ml-56 md:max-w-md md:px-3");
			add_location(main, file$O, 68, 2, 1822);
		},

		m: function mount(target, anchor) {
			insert(target, main, anchor);
			mount_component(navigationdrawer, main, null);
			append(main, t);
			mount_component(approuter, main, null);
			current = true;
		},

		p: function update(changed, ctx) {
			var navigationdrawer_changes = {};
			if (changed.$right) navigationdrawer_changes.right = ctx.$right;
			if (changed.$persistent) navigationdrawer_changes.persistent = ctx.$persistent;
			if (changed.$elevation) navigationdrawer_changes.elevation = ctx.$elevation;
			if (changed.$bp) navigationdrawer_changes.breakpoint = ctx.$bp;
			if (changed.$$scope || changed.path) navigationdrawer_changes.$$scope = { changed, ctx };
			if (!updating_showDesktop && changed.$showNav) {
				navigationdrawer_changes.showDesktop = ctx.$showNav;
			}
			if (!updating_showMobile && changed.$showNavMobile) {
				navigationdrawer_changes.showMobile = ctx.$showNavMobile;
			}
			navigationdrawer.$set(navigationdrawer_changes);

			var approuter_changes = {};
			if (!updating_path && changed.path) {
				approuter_changes.path = ctx.path;
			}
			approuter.$set(approuter_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(navigationdrawer.$$.fragment, local);

			transition_in(approuter.$$.fragment, local);

			add_render_callback(() => {
				if (!main_transition) main_transition = create_bidirectional_transition(main, fade, { duration: 300 }, true);
				main_transition.run(1);
			});

			current = true;
		},

		o: function outro(local) {
			transition_out(navigationdrawer.$$.fragment, local);
			transition_out(approuter.$$.fragment, local);

			if (!main_transition) main_transition = create_bidirectional_transition(main, fade, { duration: 300 }, false);
			main_transition.run(0);

			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(main);
			}

			destroy_component(navigationdrawer, );

			destroy_component(approuter, );

			if (detaching) {
				if (main_transition) main_transition.end();
			}
		}
	};
}

// (83:10) {#if item.to === '/typography'}
function create_if_block_1$8(ctx) {
	var hr, t, h6;

	return {
		c: function create() {
			hr = element("hr");
			t = space();
			h6 = element("h6");
			h6.textContent = "Utilities";
			add_location(hr, file$O, 83, 12, 2388);
			attr(h6, "class", "p-6 ml-1 py-2 text-xs text-gray-900");
			add_location(h6, file$O, 84, 12, 2407);
		},

		m: function mount(target, anchor) {
			insert(target, hr, anchor);
			insert(target, t, anchor);
			insert(target, h6, anchor);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(hr);
				detach(t);
				detach(h6);
			}
		}
	};
}

// (82:8) <span slot="item" let:item class="cursor-pointer">
function create_item_slot(ctx) {
	var span, t, a, a_href_value, current;

	var if_block = (ctx.item.to === '/typography') && create_if_block_1$8();

	var listitem_spread_levels = [
		{ selected: ctx.path.includes(ctx.item.to) },
		ctx.item,
		{ dense: true },
		{ navigation: true }
	];

	let listitem_props = {};
	for (var i = 0; i < listitem_spread_levels.length; i += 1) {
		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
	}
	var listitem = new ListItem({ props: listitem_props, $$inline: true });

	return {
		c: function create() {
			span = element("span");
			if (if_block) if_block.c();
			t = space();
			a = element("a");
			listitem.$$.fragment.c();
			attr(a, "href", a_href_value = ctx.item.to);
			add_location(a, file$O, 87, 10, 2497);
			attr(span, "slot", "item");
			attr(span, "class", "cursor-pointer");
			add_location(span, file$O, 81, 8, 2283);
		},

		m: function mount(target, anchor) {
			insert(target, span, anchor);
			if (if_block) if_block.m(span, null);
			append(span, t);
			append(span, a);
			mount_component(listitem, a, null);
			current = true;
		},

		p: function update(changed, ctx) {
			if (ctx.item.to === '/typography') {
				if (!if_block) {
					if_block = create_if_block_1$8();
					if_block.c();
					if_block.m(span, t);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			var listitem_changes = (changed.path || changed.item) ? get_spread_update(listitem_spread_levels, [
				{ selected: ctx.path.includes(ctx.item.to) },
				(changed.item) && ctx.item,
				{ dense: true },
				{ navigation: true }
			]) : {};
			listitem.$set(listitem_changes);

			if ((!current || changed.item) && a_href_value !== (a_href_value = ctx.item.to)) {
				attr(a, "href", a_href_value);
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(listitem.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(listitem.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(span);
			}

			if (if_block) if_block.d();

			destroy_component(listitem, );
		}
	};
}

// (81:6) <List items={menu}>
function create_default_slot_1$c(ctx) {

	return {
		c: noop,
		m: noop,
		p: noop,
		i: noop,
		o: noop,
		d: noop
	};
}

// (73:4) <NavigationDrawer       bind:showDesktop={$showNav}       bind:showMobile={$showNavMobile}       right={$right}       persistent={$persistent}       elevation={$elevation}       breakpoint={$bp}>
function create_default_slot$j(ctx) {
	var h6, t1, t2, hr, current;

	var list = new List({
		props: {
		items: ctx.menu,
		$$slots: {
		default: [create_default_slot_1$c],
		item: [create_item_slot, ({ item }) => ({ item })]
	},
		$$scope: { ctx }
	},
		$$inline: true
	});

	return {
		c: function create() {
			h6 = element("h6");
			h6.textContent = "Components";
			t1 = space();
			list.$$.fragment.c();
			t2 = space();
			hr = element("hr");
			attr(h6, "class", "p-6 ml-1 pb-2 text-xs text-gray-900");
			add_location(h6, file$O, 79, 6, 2185);
			add_location(hr, file$O, 96, 6, 2709);
		},

		m: function mount(target, anchor) {
			insert(target, h6, anchor);
			insert(target, t1, anchor);
			mount_component(list, target, anchor);
			insert(target, t2, anchor);
			insert(target, hr, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			var list_changes = {};
			if (changed.menu) list_changes.items = ctx.menu;
			if (changed.$$scope || changed.path || changed.item) list_changes.$$scope = { changed, ctx };
			list.$set(list_changes);
		},

		i: function intro(local) {
			if (current) return;
			transition_in(list.$$.fragment, local);

			current = true;
		},

		o: function outro(local) {
			transition_out(list.$$.fragment, local);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(h6);
				detach(t1);
			}

			destroy_component(list, detaching);

			if (detaching) {
				detach(t2);
				detach(hr);
			}
		}
	};
}

function create_fragment$Q(ctx) {
	var t0, t1, t2, if_block_anchor, current;

	var each_value = ctx.menu;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	var appbar = new AppBar({
		props: {
		$$slots: { default: [create_default_slot_2$8] },
		$$scope: { ctx }
	},
		$$inline: true
	});

	var if_block = (ctx.$bp) && create_if_block$i(ctx);

	return {
		c: function create() {
			t0 = space();

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			appbar.$$.fragment.c();
			t2 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			document.title = "Smelte: Material design using Tailwind CSS for Svelte";
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert(target, t0, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, t1, anchor);
			mount_component(appbar, target, anchor);
			insert(target, t2, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},

		p: function update(changed, ctx) {
			if (changed.menu) {
				each_value = ctx.menu;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(t1.parentNode, t1);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}

			var appbar_changes = {};
			if (changed.$$scope || changed.path) appbar_changes.$$scope = { changed, ctx };
			appbar.$set(appbar_changes);

			if (ctx.$bp) {
				if (if_block) {
					if_block.p(changed, ctx);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block$i(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();
				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});
				check_outros();
			}
		},

		i: function intro(local) {
			if (current) return;
			transition_in(appbar.$$.fragment, local);

			transition_in(if_block);
			current = true;
		},

		o: function outro(local) {
			transition_out(appbar.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach(t0);
			}

			destroy_each(each_blocks, detaching);

			if (detaching) {
				detach(t1);
			}

			destroy_component(appbar, detaching);

			if (detaching) {
				detach(t2);
			}

			if (if_block) if_block.d(detaching);

			if (detaching) {
				detach(if_block_anchor);
			}
		}
	};
}

function instance$G($$self, $$props, $$invalidate) {
	let $showNavMobile, $bp, $showNav, $right, $persistent, $elevation;

	validate_store(showNavMobile, 'showNavMobile');
	subscribe($$self, showNavMobile, $$value => { $showNavMobile = $$value; $$invalidate('$showNavMobile', $showNavMobile); });
	validate_store(showNav, 'showNav');
	subscribe($$self, showNav, $$value => { $showNav = $$value; $$invalidate('$showNav', $showNav); });
	validate_store(right, 'right');
	subscribe($$self, right, $$value => { $right = $$value; $$invalidate('$right', $right); });
	validate_store(persistent, 'persistent');
	subscribe($$self, persistent, $$value => { $persistent = $$value; $$invalidate('$persistent', $persistent); });
	validate_store(elevation, 'elevation');
	subscribe($$self, elevation, $$value => { $elevation = $$value; $$invalidate('$elevation', $elevation); });

	
  const bp = breakpoint(); validate_store(bp, 'bp'); subscribe($$self, bp, $$value => { $bp = $$value; $$invalidate('$bp', $bp); });
  // $: path = $page.path;
  let path = '';

  const menu = menu1.concat(menu2).map(x =>({ to: x.to, text: x.text }));

	function tabs_selected_binding(value) {
		path = value;
		$$invalidate('path', path);
	}

	function click_handler() {
		return showNavMobile.set(!$showNavMobile);
	}

	function navigationdrawer_showDesktop_binding(value) {
		$showNav = value;
		showNav.set($showNav);
	}

	function navigationdrawer_showMobile_binding(value_1) {
		$showNavMobile = value_1;
		showNavMobile.set($showNavMobile);
	}

	function approuter_path_binding(value_2) {
		path = value_2;
		$$invalidate('path', path);
	}

	return {
		bp,
		path,
		menu,
		$showNavMobile,
		$bp,
		$showNav,
		$right,
		$persistent,
		$elevation,
		tabs_selected_binding,
		click_handler,
		navigationdrawer_showDesktop_binding,
		navigationdrawer_showMobile_binding,
		approuter_path_binding
	};
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$G, create_fragment$Q, safe_not_equal, []);
	}
}

const app = new App({
    target: document.body
});
//# sourceMappingURL=main.js.map
