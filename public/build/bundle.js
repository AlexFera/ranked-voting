
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
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
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

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
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
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

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.44.0 */

    const { Error: Error_1$1, Object: Object_1, console: console_1 } = globals;

    // (251:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
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
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
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
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
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
    				} else {
    					if_block.p(ctx, dirty);
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
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn('Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading');

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf('#/');

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: '/';

    	// Check if there's a querystring
    	const qsPosition = location.indexOf('?');

    	let querystring = '';

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener('hashchange', update, false);

    	return function stop() {
    		window.removeEventListener('hashchange', update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == '#' ? '' : '#') + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != '/' && location.indexOf('#/') !== 0) {
    		throw Error('Invalid parameter location');
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == '#' ? '' : '#') + location;

    	try {
    		const newState = { ...history.state };
    		delete newState['__svelte_spa_router_scrollX'];
    		delete newState['__svelte_spa_router_scrollY'];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.');
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event('hashchange'));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
    		throw Error('Action "link" can only be used with <a> tags');
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute('href');

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == '/') {
    		// Add # to the href attribute
    		href = '#' + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
    		throw Error('Invalid value for "href" attribute: ' + href);
    	}

    	node.setAttribute('href', href);

    	node.addEventListener('click', event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute('href'));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == 'string') {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Router', slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = '' } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true)) {
    				throw Error('Invalid component object');
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == 'string' && (path.length < 1 || path.charAt(0) != '/' && path.charAt(0) != '*') || typeof path == 'object' && !(path instanceof RegExp)) {
    				throw Error('Invalid value for "path" argument - strings must start with / or *');
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == 'object' && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == 'string') {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || '/';
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || '/';
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener('popstate', popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == 'object' && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick('conditionsFailed', detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoading', Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == 'object' && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick('routeLoaded', Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener('popstate', popStateChanged);
    	});

    	const writable_props = ['routes', 'prefix', 'restoreScrollState'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc
    	});

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate(3, routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ('restoreScrollState' in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ('component' in $$props) $$invalidate(0, component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ('props' in $$props) $$invalidate(2, props = $$props.props);
    		if ('previousScrollState' in $$props) previousScrollState = $$props.previousScrollState;
    		if ('popStateChanged' in $$props) popStateChanged = $$props.popStateChanged;
    		if ('lastLoc' in $$props) lastLoc = $$props.lastLoc;
    		if ('componentObj' in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? 'manual' : 'auto';
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get routes() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1$1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1$1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client\pages\Index.svelte generated by Svelte v3.44.0 */

    const { Error: Error_1 } = globals;
    const file$5 = "client\\pages\\Index.svelte";

    // (57:8) {#if winner}
    function create_if_block_1$1(ctx) {
    	let div2;
    	let header;
    	let p0;
    	let t1;
    	let div1;
    	let div0;
    	let p1;
    	let t2_value = /*winner*/ ctx[3].title + "";
    	let t2;
    	let t3;
    	let p2;
    	let t4_value = /*winner*/ ctx[3].body + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			header = element("header");
    			p0 = element("p");
    			p0.textContent = "The winner of the current election";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p2 = element("p");
    			t4 = text(t4_value);
    			attr_dev(p0, "class", "card-header-title");
    			add_location(p0, file$5, 59, 20, 1639);
    			attr_dev(header, "class", "card-header");
    			add_location(header, file$5, 58, 16, 1589);
    			attr_dev(p1, "class", "title");
    			add_location(p1, file$5, 65, 24, 1894);
    			attr_dev(p2, "class", "subtitle");
    			add_location(p2, file$5, 66, 24, 1955);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$5, 64, 20, 1847);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$5, 63, 16, 1799);
    			attr_dev(div2, "class", "card");
    			add_location(div2, file$5, 57, 12, 1553);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, header);
    			append_dev(header, p0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(p2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winner*/ 8 && t2_value !== (t2_value = /*winner*/ ctx[3].title + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*winner*/ 8 && t4_value !== (t4_value = /*winner*/ ctx[3].body + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(57:8) {#if winner}",
    		ctx
    	});

    	return block;
    }

    // (88:16) {#if !isValid}
    function create_if_block$1(ctx) {
    	let span;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			p = element("p");
    			t = text(/*validationMessage*/ ctx[1]);
    			attr_dev(p, "class", "help is-danger");
    			add_location(p, file$5, 89, 24, 2839);
    			attr_dev(span, "class", "validation-hint");
    			add_location(span, file$5, 88, 20, 2783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*validationMessage*/ 2) set_data_dev(t, /*validationMessage*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(88:16) {#if !isValid}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let section0;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let section1;
    	let div5;
    	let t4;
    	let br0;
    	let t5;
    	let h1;
    	let t7;
    	let form;
    	let div2;
    	let label;
    	let t9;
    	let div1;
    	let input;
    	let t10;
    	let t11;
    	let div4;
    	let div3;
    	let button;
    	let t13;
    	let br1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*winner*/ ctx[3] && create_if_block_1$1(ctx);
    	let if_block1 = !/*isValid*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Welcome";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "to Ranked Voting";
    			t3 = space();
    			section1 = element("section");
    			div5 = element("div");
    			if (if_block0) if_block0.c();
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			h1 = element("h1");
    			h1.textContent = "Cast your own vote";
    			t7 = space();
    			form = element("form");
    			div2 = element("div");
    			label = element("label");
    			label.textContent = "Username";
    			t9 = space();
    			div1 = element("div");
    			input = element("input");
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			div4 = element("div");
    			div3 = element("div");
    			button = element("button");
    			button.textContent = "Register me to vote";
    			t13 = space();
    			br1 = element("br");
    			attr_dev(p0, "class", "title");
    			add_location(p0, file$5, 49, 8, 1357);
    			attr_dev(p1, "class", "subtitle");
    			add_location(p1, file$5, 50, 8, 1395);
    			attr_dev(div0, "class", "hero-body");
    			add_location(div0, file$5, 48, 4, 1324);
    			attr_dev(section0, "class", "hero is-primary");
    			add_location(section0, file$5, 47, 0, 1285);
    			add_location(br0, file$5, 71, 8, 2089);
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$5, 72, 8, 2105);
    			attr_dev(label, "class", "label");
    			attr_dev(label, "for", "username");
    			add_location(label, file$5, 75, 16, 2238);
    			attr_dev(input, "id", "username-input");
    			attr_dev(input, "class", "input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "username");
    			attr_dev(input, "placeholder", "Enter a unique username");
    			toggle_class(input, "is-danger", !/*isValid*/ ctx[0]);
    			add_location(input, file$5, 77, 20, 2351);
    			attr_dev(div1, "class", "control");
    			add_location(div1, file$5, 76, 16, 2308);
    			attr_dev(div2, "class", "field");
    			add_location(div2, file$5, 74, 12, 2201);
    			attr_dev(button, "class", "button is-primary");
    			add_location(button, file$5, 96, 20, 3067);
    			attr_dev(div3, "class", "control");
    			add_location(div3, file$5, 95, 16, 3024);
    			attr_dev(div4, "class", "field is-grouped");
    			add_location(div4, file$5, 94, 12, 2976);
    			add_location(form, file$5, 73, 8, 2156);
    			add_location(br1, file$5, 105, 8, 3348);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$5, 55, 4, 1494);
    			attr_dev(section1, "class", "section");
    			add_location(section1, file$5, 54, 0, 1463);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, div5);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t4);
    			append_dev(div5, br0);
    			append_dev(div5, t5);
    			append_dev(div5, h1);
    			append_dev(div5, t7);
    			append_dev(div5, form);
    			append_dev(form, div2);
    			append_dev(div2, label);
    			append_dev(div2, t9);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*username*/ ctx[2]);
    			append_dev(div2, t10);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(form, t11);
    			append_dev(form, div4);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(div5, t13);
    			append_dev(div5, br1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button, "click", /*handleCreateUser*/ ctx[4], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*winner*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div5, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*username*/ 4 && input.value !== /*username*/ ctx[2]) {
    				set_input_value(input, /*username*/ ctx[2]);
    			}

    			if (dirty & /*isValid*/ 1) {
    				toggle_class(input, "is-danger", !/*isValid*/ ctx[0]);
    			}

    			if (!/*isValid*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Index', slots, []);
    	let isValid = true;
    	let validationMessage = "";
    	let username;
    	let winner;

    	onMount(async () => {
    		const getWinnerResponse = await fetch("http://127.0.0.1:8000/api/results");
    		$$invalidate(3, winner = await getWinnerResponse.json());
    	});

    	const handleCreateUser = async () => {
    		$$invalidate(0, isValid = true);
    		$$invalidate(1, validationMessage = "");

    		if (!username || !username.match(/^[a-zA-Z0-9\-\.\_]+$/) || username.length > 50) {
    			$$invalidate(0, isValid = false);
    			$$invalidate(1, validationMessage = "Username is invalid");
    			return;
    		}

    		const user = { id: 0, username };

    		const response = await fetch("http://127.0.0.1:8000/api/user/", {
    			method: "POST",
    			cache: "no-cache",
    			credentials: "omit",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(user)
    		});

    		if (!response.ok) {
    			throw new Error(await response.text());
    		}

    		const obj = await response.json();

    		if (obj.status === "error") {
    			$$invalidate(0, isValid = false);
    			$$invalidate(1, validationMessage = obj.reason);
    		} else {
    			push(`/vote/${obj.token}`);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function submit_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_input_handler() {
    		username = this.value;
    		$$invalidate(2, username);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		push,
    		isValid,
    		validationMessage,
    		username,
    		winner,
    		handleCreateUser
    	});

    	$$self.$inject_state = $$props => {
    		if ('isValid' in $$props) $$invalidate(0, isValid = $$props.isValid);
    		if ('validationMessage' in $$props) $$invalidate(1, validationMessage = $$props.validationMessage);
    		if ('username' in $$props) $$invalidate(2, username = $$props.username);
    		if ('winner' in $$props) $$invalidate(3, winner = $$props.winner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isValid,
    		validationMessage,
    		username,
    		winner,
    		handleCreateUser,
    		submit_handler,
    		input_input_handler
    	];
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Index",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* client\pages\About.svelte generated by Svelte v3.44.0 */

    const file$4 = "client\\pages\\About.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div;
    	let h1;
    	let t1;
    	let br;
    	let t2;
    	let h20;
    	let t3;
    	let a0;
    	let t5;
    	let a1;
    	let t7;
    	let a2;
    	let t9;
    	let h21;
    	let t11;
    	let h22;
    	let t12;
    	let em;
    	let t14;
    	let t15;
    	let h23;
    	let t16;
    	let ul;
    	let li0;
    	let a3;
    	let t18;
    	let li1;
    	let a4;
    	let t20;
    	let li2;
    	let a5;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Ranked Voting";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			h20 = element("h2");
    			t3 = text("This is a Web App example that uses ");
    			a0 = element("a");
    			a0.textContent = "Svelte";
    			t5 = text("\r\n            as the frontend with Rust ");
    			a1 = element("a");
    			a1.textContent = "Rocket";
    			t7 = text(" as\r\n            the backend API to do\r\n            ");
    			a2 = element("a");
    			a2.textContent = "ranked choice voting.";
    			t9 = space();
    			h21 = element("h2");
    			h21.textContent = "Each user ranks the candidates according to their preference, and an\r\n            election is run after each vote is cast.";
    			t11 = space();
    			h22 = element("h2");
    			t12 = text("The implementation is ");
    			em = element("em");
    			em.textContent = "not";
    			t14 = text(" secure. There is no registration mechanism.\r\n            Users simply identity with a self-chosen username, so any user can change\r\n            any other's ballot simply by giving their username.");
    			t15 = space();
    			h23 = element("h2");
    			t16 = text("Built With:\r\n            ");
    			ul = element("ul");
    			li0 = element("li");
    			a3 = element("a");
    			a3.textContent = "Rocket";
    			t18 = space();
    			li1 = element("li");
    			a4 = element("a");
    			a4.textContent = "Svelte";
    			t20 = space();
    			li2 = element("li");
    			a5 = element("a");
    			a5.textContent = "Bulma";
    			attr_dev(h1, "class", "title");
    			add_location(h1, file$4, 2, 8, 75);
    			add_location(br, file$4, 3, 8, 121);
    			attr_dev(a0, "href", "https://svelte.dev");
    			add_location(a0, file$4, 5, 48, 208);
    			attr_dev(a1, "href", "https://rocket.rs");
    			add_location(a1, file$4, 8, 38, 319);
    			attr_dev(a2, "href", "https://ballotpedia.org/Ranked-choice_voting_(RCV");
    			add_location(a2, file$4, 10, 12, 409);
    			attr_dev(h20, "class", "subtitle");
    			add_location(h20, file$4, 4, 8, 137);
    			attr_dev(h21, "class", "subtitle");
    			add_location(h21, file$4, 14, 8, 551);
    			add_location(em, file$4, 19, 34, 790);
    			attr_dev(h22, "class", "subtitle");
    			add_location(h22, file$4, 18, 8, 733);
    			attr_dev(a3, "href", "https://rocket.rs/");
    			add_location(a3, file$4, 27, 20, 1115);
    			add_location(li0, file$4, 27, 16, 1111);
    			attr_dev(a4, "href", "https://svelte.dev/");
    			add_location(a4, file$4, 28, 20, 1181);
    			add_location(li1, file$4, 28, 16, 1177);
    			attr_dev(a5, "href", "https://bulma.io");
    			add_location(a5, file$4, 29, 20, 1248);
    			add_location(li2, file$4, 29, 16, 1244);
    			add_location(ul, file$4, 26, 12, 1089);
    			attr_dev(h23, "class", "subtitle");
    			add_location(h23, file$4, 24, 8, 1029);
    			attr_dev(div, "class", "container");
    			add_location(div, file$4, 1, 4, 42);
    			attr_dev(section, "id", "about");
    			attr_dev(section, "class", "section");
    			add_location(section, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, br);
    			append_dev(div, t2);
    			append_dev(div, h20);
    			append_dev(h20, t3);
    			append_dev(h20, a0);
    			append_dev(h20, t5);
    			append_dev(h20, a1);
    			append_dev(h20, t7);
    			append_dev(h20, a2);
    			append_dev(div, t9);
    			append_dev(div, h21);
    			append_dev(div, t11);
    			append_dev(div, h22);
    			append_dev(h22, t12);
    			append_dev(h22, em);
    			append_dev(h22, t14);
    			append_dev(div, t15);
    			append_dev(div, h23);
    			append_dev(h23, t16);
    			append_dev(h23, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a3);
    			append_dev(ul, t18);
    			append_dev(ul, li1);
    			append_dev(li1, a4);
    			append_dev(ul, t20);
    			append_dev(ul, li2);
    			append_dev(li2, a5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

    // Older browsers don't support event options, feature detect it.

    // Adopted and modified solution from Bohdan Didukh (2017)
    // https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

    var hasPassiveEvents = false;
    if (typeof window !== 'undefined') {
      var passiveTestOptions = {
        get passive() {
          hasPassiveEvents = true;
          return undefined;
        }
      };
      window.addEventListener('testPassive', null, passiveTestOptions);
      window.removeEventListener('testPassive', null, passiveTestOptions);
    }

    var isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


    var locks = [];
    var documentListenerAdded = false;
    var initialClientY = -1;
    var previousBodyOverflowSetting = void 0;
    var previousBodyPosition = void 0;
    var previousBodyPaddingRight = void 0;

    // returns true if `el` should be allowed to receive touchmove events.
    var allowTouchMove = function allowTouchMove(el) {
      return locks.some(function (lock) {
        if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
          return true;
        }

        return false;
      });
    };

    var preventDefault = function preventDefault(rawEvent) {
      var e = rawEvent || window.event;

      // For the case whereby consumers adds a touchmove event listener to document.
      // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
      // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
      // the touchmove event on document will break.
      if (allowTouchMove(e.target)) {
        return true;
      }

      // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
      if (e.touches.length > 1) return true;

      if (e.preventDefault) e.preventDefault();

      return false;
    };

    var setOverflowHidden = function setOverflowHidden(options) {
      // If previousBodyPaddingRight is already set, don't set it again.
      if (previousBodyPaddingRight === undefined) {
        var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
        var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

        if (_reserveScrollBarGap && scrollBarGap > 0) {
          var computedBodyPaddingRight = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'), 10);
          previousBodyPaddingRight = document.body.style.paddingRight;
          document.body.style.paddingRight = computedBodyPaddingRight + scrollBarGap + 'px';
        }
      }

      // If previousBodyOverflowSetting is already set, don't set it again.
      if (previousBodyOverflowSetting === undefined) {
        previousBodyOverflowSetting = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
    };

    var restoreOverflowSetting = function restoreOverflowSetting() {
      if (previousBodyPaddingRight !== undefined) {
        document.body.style.paddingRight = previousBodyPaddingRight;

        // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
        // can be set again.
        previousBodyPaddingRight = undefined;
      }

      if (previousBodyOverflowSetting !== undefined) {
        document.body.style.overflow = previousBodyOverflowSetting;

        // Restore previousBodyOverflowSetting to undefined
        // so setOverflowHidden knows it can be set again.
        previousBodyOverflowSetting = undefined;
      }
    };

    var setPositionFixed = function setPositionFixed() {
      return window.requestAnimationFrame(function () {
        // If previousBodyPosition is already set, don't set it again.
        if (previousBodyPosition === undefined) {
          previousBodyPosition = {
            position: document.body.style.position,
            top: document.body.style.top,
            left: document.body.style.left
          };

          // Update the dom inside an animation frame 
          var _window = window,
              scrollY = _window.scrollY,
              scrollX = _window.scrollX,
              innerHeight = _window.innerHeight;

          document.body.style.position = 'fixed';
          document.body.style.top = -scrollY;
          document.body.style.left = -scrollX;

          setTimeout(function () {
            return window.requestAnimationFrame(function () {
              // Attempt to check if the bottom bar appeared due to the position change
              var bottomBarHeight = innerHeight - window.innerHeight;
              if (bottomBarHeight && scrollY >= innerHeight) {
                // Move the content further up so that the bottom bar doesn't hide it
                document.body.style.top = -(scrollY + bottomBarHeight);
              }
            });
          }, 300);
        }
      });
    };

    var restorePositionSetting = function restorePositionSetting() {
      if (previousBodyPosition !== undefined) {
        // Convert the position from "px" to Int
        var y = -parseInt(document.body.style.top, 10);
        var x = -parseInt(document.body.style.left, 10);

        // Restore styles
        document.body.style.position = previousBodyPosition.position;
        document.body.style.top = previousBodyPosition.top;
        document.body.style.left = previousBodyPosition.left;

        // Restore scroll
        window.scrollTo(x, y);

        previousBodyPosition = undefined;
      }
    };

    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
    var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
      return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
    };

    var handleScroll = function handleScroll(event, targetElement) {
      var clientY = event.targetTouches[0].clientY - initialClientY;

      if (allowTouchMove(event.target)) {
        return false;
      }

      if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
        // element is at the top of its scroll.
        return preventDefault(event);
      }

      if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
        // element is at the bottom of its scroll.
        return preventDefault(event);
      }

      event.stopPropagation();
      return true;
    };

    var disableBodyScroll = function disableBodyScroll(targetElement, options) {
      // targetElement must be provided
      if (!targetElement) {
        // eslint-disable-next-line no-console
        console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
        return;
      }

      // disableBodyScroll must not have been called on this targetElement before
      if (locks.some(function (lock) {
        return lock.targetElement === targetElement;
      })) {
        return;
      }

      var lock = {
        targetElement: targetElement,
        options: options || {}
      };

      locks = [].concat(_toConsumableArray(locks), [lock]);

      if (isIosDevice) {
        setPositionFixed();
      } else {
        setOverflowHidden(options);
      }

      if (isIosDevice) {
        targetElement.ontouchstart = function (event) {
          if (event.targetTouches.length === 1) {
            // detect single touch.
            initialClientY = event.targetTouches[0].clientY;
          }
        };
        targetElement.ontouchmove = function (event) {
          if (event.targetTouches.length === 1) {
            // detect single touch.
            handleScroll(event, targetElement);
          }
        };

        if (!documentListenerAdded) {
          document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
          documentListenerAdded = true;
        }
      }
    };

    var enableBodyScroll = function enableBodyScroll(targetElement) {
      if (!targetElement) {
        // eslint-disable-next-line no-console
        console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
        return;
      }

      locks = locks.filter(function (lock) {
        return lock.targetElement !== targetElement;
      });

      if (isIosDevice) {
        targetElement.ontouchstart = null;
        targetElement.ontouchmove = null;

        if (documentListenerAdded && locks.length === 0) {
          document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
          documentListenerAdded = false;
        }
      }

      if (isIosDevice) {
        restorePositionSetting();
      } else {
        restoreOverflowSetting();
      }
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var agnosticDraggable = createCommonjsModule(function (module, exports) {
    !function(e,t){t(exports);}(commonjsGlobal,(function(e){function t(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r);}return n}function n(e){for(var n=1;n<arguments.length;n++){var r=null!=arguments[n]?arguments[n]:{};n%2?t(Object(r),!0).forEach((function(t){a(e,t,r[t]);})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):t(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t));}));}return e}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function i(e,t,n){return t&&o(e.prototype,t),n&&o(e,n),e}function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&u(e,t);}function l(e){return (l=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function u(e,t){return (u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e,t){return !t||"object"!=typeof t&&"function"!=typeof t?c(e):t}function p(e){var t=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return !1}}();return function(){var n,r=l(e);if(t){var o=l(this).constructor;n=Reflect.construct(r,arguments,o);}else n=r.apply(this,arguments);return f(this,n)}}function h(e,t,n){return (h="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(e,t,n){var r=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=l(e)););return e}(e,t);if(r){var o=Object.getOwnPropertyDescriptor(r,t);return o.get?o.get.call(n):o.value}})(e,t,n||e)}function d(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var n=e&&("undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"]);if(null!=n){var r,o,i=[],a=!0,s=!1;try{for(n=n.call(e);!(a=(r=n.next()).done)&&(i.push(r.value),!t||i.length!==t);a=!0);}catch(e){s=!0,o=e;}finally{try{a||null==n.return||n.return();}finally{if(s)throw o}}return i}}(e,t)||function(e,t){if(e){if("string"==typeof e)return g(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return "Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?g(e,t):void 0}}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function g(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var v="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof commonjsGlobal?commonjsGlobal:"undefined"!=typeof self?self:{},m=function(e){return void 0===e},y=function(){function e(t){r(this,e),a(this,"draggable",null),a(this,"constraintPosition",(function(e){return e})),this.draggable=t;}return i(e,[{key:"startEvent",get:function(){return m(this.draggable.items)?"drag:start":"sort:start"}},{key:"moveEvent",get:function(){return m(this.draggable.items)?"drag:move":"sort:move"}},{key:"stopEvent",get:function(){return m(this.draggable.items)?"drag:stop":"sort:stop"}},{key:"attach",value:function(){this.draggable.on(this.startEvent,this.onDragStart),this.draggable.on(this.moveEvent,this.onDragMove),this.draggable.on(this.stopEvent,this.onDragStop);}},{key:"detach",value:function(){this.draggable.off(this.startEvent,this.onDragStart),this.draggable.off(this.moveEvent,this.onDragMove),this.draggable.off(this.stopEvent,this.onDragStop);}},{key:"onDragStart",value:function(e){}},{key:"onDragMove",value:function(e){}},{key:"onDragStop",value:function(e){}}]),e}();function b(e){return e&&e.ownerDocument||document}function w(e,t){e.classList?e.classList.add(t):function(e,t){return e.classList?!!t&&e.classList.contains(t):-1!==(" "+(e.className.baseVal||e.className)+" ").indexOf(" "+t+" ")}(e,t)||("string"==typeof e.className?e.className=e.className+" "+t:e.setAttribute("class",(e.className&&e.className.baseVal||"")+" "+t));}var E=!("undefined"==typeof window||!window.document||!window.document.createElement),S=!1,P=!1;try{var k={get passive(){return S=!0},get once(){return P=S=!0}};E&&(window.addEventListener("test",k,k),window.removeEventListener("test",k,!0));}catch(e){}var O=/([A-Z])/g,I=/^ms-/;function L(e){return function(e){return e.replace(O,"-$1").toLowerCase()}(e).replace(I,"-ms-")}var x=/^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;function D(e,t){var n="",r="";if("string"==typeof t)return e.style.getPropertyValue(L(t))||function(e,t){return function(e){var t=b(e);return t&&t.defaultView||window}(e).getComputedStyle(e,t)}(e).getPropertyValue(L(t));Object.keys(t).forEach((function(o){var i=t[o];i||0===i?function(e){return !(!e||!x.test(e))}(o)?r+=o+"("+i+") ":n+=L(o)+": "+i+";":e.style.removeProperty(L(o));})),r&&(n+="transform: "+r+";"),e.style.cssText+=";"+n;}function C(e,t,n,r){return function(e,t,n,r){if(r&&"boolean"!=typeof r&&!P){var o=r.once,i=r.capture,a=n;!P&&o&&(a=n.__once||function e(r){this.removeEventListener(t,e,i),n.call(this,r);},n.__once=a),e.addEventListener(t,a,S?r:i);}e.addEventListener(t,n,r);}(e,t,n,r),function(){!function(e,t,n,r){var o=r&&"boolean"!=typeof r?r.capture:r;e.removeEventListener(t,n,o),n.__once&&e.removeEventListener(t,n.__once,o);}(e,t,n,r);}}var M,j=(new Date).getTime(),T=function(e){var t=(new Date).getTime(),n=Math.max(0,16-(t-j)),r=setTimeout(e,n);return j=t,r},A=function(e,t){return e+(e?t[0].toUpperCase()+t.substr(1):t)+"AnimationFrame"};function N(e,t){if(!M){var n=document.body,r=n.matches||n.matchesSelector||n.webkitMatchesSelector||n.mozMatchesSelector||n.msMatchesSelector;M=function(e,t){return r.call(e,t)};}return M(e,t)}function H(e,t,n){e.closest&&!n&&e.closest(t);var r=e;do{if(N(r,t))return r;r=r.parentElement;}while(r&&r!==n&&r.nodeType===document.ELEMENT_NODE);return null}function R(e,t){return e.contains?e.contains(t):e.compareDocumentPosition?e===t||!!(16&e.compareDocumentPosition(t)):void 0}E&&["","webkit","moz","o","ms"].some((function(e){var t=A(e,"request");return t in window&&(A(e,"cancel"),T=function(e){return window[t](e)}),!!T})),Function.prototype.bind.call(Function.prototype.call,[].slice);var _=Function.prototype.bind.call(Function.prototype.call,[].slice);function F(e,t){return _(e.querySelectorAll(t))}function X(e){return "nodeType"in e&&e.nodeType===document.DOCUMENT_NODE}function Y(e){return "window"in e&&e.window===e?e:X(e)&&e.defaultView||!1}function z(e){var t="pageXOffset"===e?"scrollLeft":"scrollTop";return function(n,r){var o=Y(n);if(void 0===r)return o?o[e]:n[t];o?o.scrollTo(o[e],r):n[t]=r;}}var B=z("pageXOffset"),W=z("pageYOffset");function V(e){var t=b(e),n={top:0,left:0,height:0,width:0},r=t&&t.documentElement;return r&&R(r,e)?(void 0!==e.getBoundingClientRect&&(n=e.getBoundingClientRect()),n={top:n.top+W(r)-(r.clientTop||0),left:n.left+B(r)-(r.clientLeft||0),width:n.width,height:n.height}):n}function q(e,t){var n=Y(e);return n?n.innerHeight:t?e.clientHeight:V(e).height}function U(e){for(var t,n=b(e),r=e&&e.offsetParent;(t=r)&&"offsetParent"in t&&"HTML"!==r.nodeName&&"static"===D(r,"position");)r=r.offsetParent;return r||n.documentElement}function $(){return ($=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r]);}return e}).apply(this,arguments)}function G(e,t){return e.replace(new RegExp("(^|\\s)"+t+"(?:\\s|$)","g"),"$1").replace(/\s+/g," ").replace(/^\s*|\s*$/g,"")}function K(e,t){e.classList?e.classList.remove(t):"string"==typeof e.className?e.className=G(e.className,t):e.setAttribute("class",G(e.className&&e.className.baseVal||"",t));}function Z(e,t){var n=D(e,"position"),r="absolute"===n,o=e.ownerDocument;if("fixed"===n)return o||document;for(;(e=e.parentNode)&&!X(e);){var i=r&&"static"===D(e,"position"),a=(D(e,"overflow")||"")+(D(e,"overflow-y")||"")+D(e,"overflow-x");if(!i&&/(auto|scroll)/.test(a)&&(t||q(e)<e.scrollHeight))return e}return o||document}function Q(e,t){var n=Y(e);return n?n.innerWidth:t?e.clientWidth:V(e).width}var J=function(e){return e&&e.Math==Math&&e},ee=J("object"==typeof globalThis&&globalThis)||J("object"==typeof window&&window)||J("object"==typeof self&&self)||J("object"==typeof v&&v)||function(){return this}()||Function("return this")(),te={},ne=function(e){try{return !!e()}catch(e){return !0}},re=!ne((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]})),oe={},ie={}.propertyIsEnumerable,ae=Object.getOwnPropertyDescriptor,se=ae&&!ie.call({1:2},1);oe.f=se?function(e){var t=ae(this,e);return !!t&&t.enumerable}:ie;var le=function(e,t){return {enumerable:!(1&e),configurable:!(2&e),writable:!(4&e),value:t}},ue={}.toString,ce=function(e){return ue.call(e).slice(8,-1)},fe=ce,pe="".split,he=ne((function(){return !Object("z").propertyIsEnumerable(0)}))?function(e){return "String"==fe(e)?pe.call(e,""):Object(e)}:Object,de=function(e){if(null==e)throw TypeError("Can't call method on "+e);return e},ge=he,ve=de,me=function(e){return ge(ve(e))},ye=function(e){return "object"==typeof e?null!==e:"function"==typeof e},be=ye,we=function(e,t){if(!be(e))return e;var n,r;if(t&&"function"==typeof(n=e.toString)&&!be(r=n.call(e)))return r;if("function"==typeof(n=e.valueOf)&&!be(r=n.call(e)))return r;if(!t&&"function"==typeof(n=e.toString)&&!be(r=n.call(e)))return r;throw TypeError("Can't convert object to primitive value")},Ee=de,Se=function(e){return Object(Ee(e))},Pe=Se,ke={}.hasOwnProperty,Oe=Object.hasOwn||function(e,t){return ke.call(Pe(e),t)},Ie=ye,Le=ee.document,xe=Ie(Le)&&Ie(Le.createElement),De=function(e){return xe?Le.createElement(e):{}},Ce=De,Me=!re&&!ne((function(){return 7!=Object.defineProperty(Ce("div"),"a",{get:function(){return 7}}).a})),je=re,Te=oe,Ae=le,Ne=me,He=we,Re=Oe,_e=Me,Fe=Object.getOwnPropertyDescriptor;te.f=je?Fe:function(e,t){if(e=Ne(e),t=He(t,!0),_e)try{return Fe(e,t)}catch(e){}if(Re(e,t))return Ae(!Te.f.call(e,t),e[t])};var Xe={},Ye=ye,ze=function(e){if(!Ye(e))throw TypeError(String(e)+" is not an object");return e},Be=re,We=Me,Ve=ze,qe=we,Ue=Object.defineProperty;Xe.f=Be?Ue:function(e,t,n){if(Ve(e),t=qe(t,!0),Ve(n),We)try{return Ue(e,t,n)}catch(e){}if("get"in n||"set"in n)throw TypeError("Accessors not supported");return "value"in n&&(e[t]=n.value),e};var $e=Xe,Ge=le,Ke=re?function(e,t,n){return $e.f(e,t,Ge(1,n))}:function(e,t,n){return e[t]=n,e},Ze={exports:{}},Qe=ee,Je=Ke,et=function(e,t){try{Je(Qe,e,t);}catch(n){Qe[e]=t;}return t},tt=et,nt="__core-js_shared__",rt=ee[nt]||tt(nt,{}),ot=rt,it=Function.toString;"function"!=typeof ot.inspectSource&&(ot.inspectSource=function(e){return it.call(e)});var at=ot.inspectSource,st=at,lt=ee.WeakMap,ut="function"==typeof lt&&/native code/.test(st(lt)),ct={exports:{}},ft=rt;(ct.exports=function(e,t){return ft[e]||(ft[e]=void 0!==t?t:{})})("versions",[]).push({version:"3.14.0",mode:"global",copyright:"© 2021 Denis Pushkarev (zloirock.ru)"});var pt,ht,dt,gt=0,vt=Math.random(),mt=function(e){return "Symbol("+String(void 0===e?"":e)+")_"+(++gt+vt).toString(36)},yt=ct.exports,bt=mt,wt=yt("keys"),Et=function(e){return wt[e]||(wt[e]=bt(e))},St={},Pt=ut,kt=ye,Ot=Ke,It=Oe,Lt=rt,xt=Et,Dt=St,Ct="Object already initialized",Mt=ee.WeakMap;if(Pt||Lt.state){var jt=Lt.state||(Lt.state=new Mt),Tt=jt.get,At=jt.has,Nt=jt.set;pt=function(e,t){if(At.call(jt,e))throw new TypeError(Ct);return t.facade=e,Nt.call(jt,e,t),t},ht=function(e){return Tt.call(jt,e)||{}},dt=function(e){return At.call(jt,e)};}else {var Ht=xt("state");Dt[Ht]=!0,pt=function(e,t){if(It(e,Ht))throw new TypeError(Ct);return t.facade=e,Ot(e,Ht,t),t},ht=function(e){return It(e,Ht)?e[Ht]:{}},dt=function(e){return It(e,Ht)};}var Rt={set:pt,get:ht,has:dt,enforce:function(e){return dt(e)?ht(e):pt(e,{})},getterFor:function(e){return function(t){var n;if(!kt(t)||(n=ht(t)).type!==e)throw TypeError("Incompatible receiver, "+e+" required");return n}}},_t=ee,Ft=Ke,Xt=Oe,Yt=et,zt=at,Bt=Rt.get,Wt=Rt.enforce,Vt=String(String).split("String");(Ze.exports=function(e,t,n,r){var o,i=!!r&&!!r.unsafe,a=!!r&&!!r.enumerable,s=!!r&&!!r.noTargetGet;"function"==typeof n&&("string"!=typeof t||Xt(n,"name")||Ft(n,"name",t),(o=Wt(n)).source||(o.source=Vt.join("string"==typeof t?t:""))),e!==_t?(i?!s&&e[t]&&(a=!0):delete e[t],a?e[t]=n:Ft(e,t,n)):a?e[t]=n:Yt(t,n);})(Function.prototype,"toString",(function(){return "function"==typeof this&&Bt(this).source||zt(this)}));var qt=ee,Ut=ee,$t=function(e){return "function"==typeof e?e:void 0},Gt=function(e,t){return arguments.length<2?$t(qt[e])||$t(Ut[e]):qt[e]&&qt[e][t]||Ut[e]&&Ut[e][t]},Kt={},Zt=Math.ceil,Qt=Math.floor,Jt=function(e){return isNaN(e=+e)?0:(e>0?Qt:Zt)(e)},en=Jt,tn=Math.min,nn=function(e){return e>0?tn(en(e),9007199254740991):0},rn=Jt,on=Math.max,an=Math.min,sn=function(e,t){var n=rn(e);return n<0?on(n+t,0):an(n,t)},ln=me,un=nn,cn=sn,fn=function(e){return function(t,n,r){var o,i=ln(t),a=un(i.length),s=cn(r,a);if(e&&n!=n){for(;a>s;)if((o=i[s++])!=o)return !0}else for(;a>s;s++)if((e||s in i)&&i[s]===n)return e||s||0;return !e&&-1}},pn={includes:fn(!0),indexOf:fn(!1)},hn=Oe,dn=me,gn=pn.indexOf,vn=St,mn=function(e,t){var n,r=dn(e),o=0,i=[];for(n in r)!hn(vn,n)&&hn(r,n)&&i.push(n);for(;t.length>o;)hn(r,n=t[o++])&&(~gn(i,n)||i.push(n));return i},yn=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],bn=mn,wn=yn.concat("length","prototype");Kt.f=Object.getOwnPropertyNames||function(e){return bn(e,wn)};var En={};En.f=Object.getOwnPropertySymbols;var Sn,Pn,kn=Kt,On=En,In=ze,Ln=Gt("Reflect","ownKeys")||function(e){var t=kn.f(In(e)),n=On.f;return n?t.concat(n(e)):t},xn=Oe,Dn=Ln,Cn=te,Mn=Xe,jn=ne,Tn=/#|\.prototype\./,An=function(e,t){var n=Hn[Nn(e)];return n==_n||n!=Rn&&("function"==typeof t?jn(t):!!t)},Nn=An.normalize=function(e){return String(e).replace(Tn,".").toLowerCase()},Hn=An.data={},Rn=An.NATIVE="N",_n=An.POLYFILL="P",Fn=An,Xn=ee,Yn=te.f,zn=Ke,Bn=Ze.exports,Wn=et,Vn=function(e,t){for(var n=Dn(t),r=Mn.f,o=Cn.f,i=0;i<n.length;i++){var a=n[i];xn(e,a)||r(e,a,o(t,a));}},qn=Fn,Un=function(e,t){var n,r,o,i,a,s=e.target,l=e.global,u=e.stat;if(n=l?Xn:u?Xn[s]||Wn(s,{}):(Xn[s]||{}).prototype)for(r in t){if(i=t[r],o=e.noTargetGet?(a=Yn(n,r))&&a.value:n[r],!qn(l?r:s+(u?".":"#")+r,e.forced)&&void 0!==o){if(typeof i==typeof o)continue;Vn(i,o);}(e.sham||o&&o.sham)&&zn(i,"sham",!0),Bn(n,r,i,e);}},$n=function(e){if("function"!=typeof e)throw TypeError(String(e)+" is not a function");return e},Gn=$n,Kn=ce,Zn=Array.isArray||function(e){return "Array"==Kn(e)},Qn=Gt("navigator","userAgent")||"",Jn=Qn,er=ee.process,tr=er&&er.versions,nr=tr&&tr.v8;nr?Pn=(Sn=nr.split("."))[0]<4?1:Sn[0]+Sn[1]:Jn&&(!(Sn=Jn.match(/Edge\/(\d+)/))||Sn[1]>=74)&&(Sn=Jn.match(/Chrome\/(\d+)/))&&(Pn=Sn[1]);var rr=Pn&&+Pn,or=rr,ir=ne,ar=!!Object.getOwnPropertySymbols&&!ir((function(){var e=Symbol();return !String(e)||!(Object(e)instanceof Symbol)||!Symbol.sham&&or&&or<41})),sr=ar&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,lr=ee,ur=ct.exports,cr=Oe,fr=mt,pr=ar,hr=sr,dr=ur("wks"),gr=lr.Symbol,vr=hr?gr:gr&&gr.withoutSetter||fr,mr=function(e){return cr(dr,e)&&(pr||"string"==typeof dr[e])||(pr&&cr(gr,e)?dr[e]=gr[e]:dr[e]=vr("Symbol."+e)),dr[e]},yr=ye,br=Zn,wr=mr("species"),Er=function(e,t){var n;return br(e)&&("function"!=typeof(n=e.constructor)||n!==Array&&!br(n.prototype)?yr(n)&&null===(n=n[wr])&&(n=void 0):n=void 0),new(void 0===n?Array:n)(0===t?0:t)},Sr=he,Pr=Se,kr=nn,Or=Er,Ir=[].push,Lr=function(e){var t=1==e,n=2==e,r=3==e,o=4==e,i=6==e,a=7==e,s=5==e||i;return function(l,u,c,f){for(var p,h,d=Pr(l),g=Sr(d),v=function(e,t,n){if(Gn(e),void 0===t)return e;switch(n){case 0:return function(){return e.call(t)};case 1:return function(n){return e.call(t,n)};case 2:return function(n,r){return e.call(t,n,r)};case 3:return function(n,r,o){return e.call(t,n,r,o)}}return function(){return e.apply(t,arguments)}}(u,c,3),m=kr(g.length),y=0,b=f||Or,w=t?b(l,m):n||a?b(l,0):void 0;m>y;y++)if((s||y in g)&&(h=v(p=g[y],y,d),e))if(t)w[y]=h;else if(h)switch(e){case 3:return !0;case 5:return p;case 6:return y;case 2:Ir.call(w,p);}else switch(e){case 4:return !1;case 7:Ir.call(w,p);}return i?-1:r||o?o:w}},xr={forEach:Lr(0),map:Lr(1),filter:Lr(2),some:Lr(3),every:Lr(4),find:Lr(5),findIndex:Lr(6),filterOut:Lr(7)},Dr=ne,Cr=rr,Mr=mr("species"),jr=function(e){return Cr>=51||!Dr((function(){var t=[];return (t.constructor={})[Mr]=function(){return {foo:1}},1!==t[e](Boolean).foo}))},Tr=xr.filter;Un({target:"Array",proto:!0,forced:!jr("filter")},{filter:function(e){return Tr(this,e,arguments.length>1?arguments[1]:void 0)}});var Ar=ne,Nr=function(e,t){var n=[][e];return !!n&&Ar((function(){n.call(null,t||function(){throw 1},1);}))},Hr=xr.forEach,Rr=Nr("forEach")?[].forEach:function(e){return Hr(this,e,arguments.length>1?arguments[1]:void 0)};Un({target:"Array",proto:!0,forced:[].forEach!=Rr},{forEach:Rr});var _r=ee,Fr=Rr,Xr=Ke;for(var Yr in {CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}){var zr=_r[Yr],Br=zr&&zr.prototype;if(Br&&Br.forEach!==Fr)try{Xr(Br,"forEach",Fr);}catch(e){Br.forEach=Fr;}}var Wr=$n,Vr=ye,qr=[].slice,Ur={},$r=function(e,t,n){if(!(t in Ur)){for(var r=[],o=0;o<t;o++)r[o]="a["+o+"]";Ur[t]=Function("C,a","return new C("+r.join(",")+")");}return Ur[t](e,n)};Un({target:"Function",proto:!0},{bind:Function.bind||function(e){var t=Wr(this),n=qr.call(arguments,1),r=function(){var o=n.concat(qr.call(arguments));return this instanceof r?$r(t,o.length,o):t.apply(e,o)};return Vr(t.prototype)&&(r.prototype=t.prototype),r}});var Gr=we,Kr=Xe,Zr=le,Qr=function(e,t,n){var r=Gr(t);r in e?Kr.f(e,r,Zr(0,n)):e[r]=n;},Jr=Un,eo=ye,to=Zn,no=sn,ro=nn,oo=me,io=Qr,ao=mr,so=jr("slice"),lo=ao("species"),uo=[].slice,co=Math.max;Jr({target:"Array",proto:!0,forced:!so},{slice:function(e,t){var n,r,o,i=oo(this),a=ro(i.length),s=no(e,a),l=no(void 0===t?a:t,a);if(to(i)&&("function"!=typeof(n=i.constructor)||n!==Array&&!to(n.prototype)?eo(n)&&null===(n=n[lo])&&(n=void 0):n=void 0,n===Array||void 0===n))return uo.call(i,s,l);for(r=new(void 0===n?Array:n)(co(l-s,0)),o=0;s<l;s++,o++)s in i&&io(r,o,i[s]);return r.length=o,r}});var fo=de,po="[\t\n\v\f\r                　\u2028\u2029\ufeff]",ho=RegExp("^"+po+po+"*"),go=RegExp(po+po+"*$"),vo=function(e){return function(t){var n=String(fo(t));return 1&e&&(n=n.replace(ho,"")),2&e&&(n=n.replace(go,"")),n}},mo=(vo(3)),yo="\t\n\v\f\r                　\u2028\u2029\ufeff",bo=ee.parseInt,wo=/^[+-]?0[Xx]/,Eo=8!==bo(yo+"08")||22!==bo(yo+"0x16")?function(e,t){var n=mo(String(e));return bo(n,t>>>0||(wo.test(n)?16:10))}:bo;Un({global:!0,forced:parseInt!=Eo},{parseInt:Eo});var So=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};r(this,e),a(this,"data",null),a(this,"canceled",!1),this.data=t;}return i(e,[{key:"type",get:function(){return this.constructor.type}},{key:"cancelable",get:function(){return this.constructor.cancelable}},{key:"cancel",value:function(){this.cancelable&&(this.canceled=!0);}}]),e}();a(So,"type","event"),a(So,"cancelable",!1);var Po=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"pageX",get:function(){return this.data.pageX||null}},{key:"pageY",get:function(){return this.data.pageY||null}},{key:"target",get:function(){return this.data.target||null},set:function(e){this.data.target=e;}},{key:"caller",get:function(){return this.data.caller||null}},{key:"originalEvent",get:function(){return this.data.originalEvent||null}}]),n}(So),ko=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Po);a(ko,"type","mouse:start"),a(ko,"cancelable",!0);var Oo=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Po);a(Oo,"type","mouse:move");var Io=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Po);a(Io,"type","mouse:stop");var Lo=Function.prototype.bind.call(Function.prototype.call,[].slice),xo=function(e){e&&(e.previousDisplay=D(e,"display")||null,D(e,{display:"none"}));},Do=function(e){for(var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=e,r=[];n&&n.parentNode&&n.parentNode!==document&&(!t||!N(n.parentNode,t));)r.push(n.parentNode),n=n.parentNode;return r},Co=function(e,t){return e!==t&&R(e,t)},Mo=function(e,t){return e&&t&&t.parentNode&&t.parentNode.insertBefore(e,t),e},jo=function(e,t){return e&&t&&t.parentNode&&(t.nextSibling?t.parentNode.insertBefore(e,t.nextSibling):t.parentNode.appendChild(e)),e},To=function(e){return new Io({target:e,originalEvent:Ao("mouseup",e)})},Ao=function(e,t){var n=document.createEvent("HTMLEvents");return n.initEvent(e,!1,!0),n.target=t,n},No=function(e,t){if(e){var n=document.createEvent("HTMLEvents");n.initEvent(t,!1,!0),e.dispatchEvent(n);}},Ho=function(e){var t=function(e){void 0===e&&(e=b());try{var t=e.activeElement;return t&&t.nodeName?t:null}catch(t){return e.body}}();Co(t,e.target)||t===document.body||No(t,"blur");},Ro=function(e){return /(left|right)/.test(D(e,"float")||/(inline|table-cell)/.test(D(e,"display")))},_o=function(e){var t=D(e,"position");/^(?:r|a|f)/.test(t)||D(e,{position:"relative"});},Fo=function(e){var t=D(e,"position");/^(?:fixed|absolute)/.test(t)||D(e,{position:"absolute"});},Xo=function(e,t){return parseInt(D(e,t),10)||0},Yo=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],n=D(e,"position"),r="absolute"===n;if("fixed"===n)return document;var o=t?/(auto|scroll|hidden)/:/(auto|scroll)/,i=Do(e).filter((function(e){return (!r||"static"!==D(e,"position"))&&o.test(D(e,"overflow")+D(e,"overflowX")+D(e,"overflowY"))}));return i.length>0?i[0]:document},zo=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];return e===document||e===document.documentElement||t&&e===document.body},Bo=null;Bo||(Bo=new function e(){var t=this;r(this,e),a(this,"draggable",null),a(this,"droppables",{}),a(this,"getDroppables",(function(e){return t.droppables[e]||[]})),a(this,"addDroppable",(function(e,n){e&&n&&(t.droppables[n]||(t.droppables[n]=[]),t.droppables[n].push(e));})),a(this,"removeDroppable",(function(e,n){e&&t.droppables[n]&&(t.droppables[n]=t.droppables[n].filter((function(t){return t!==e})));})),a(this,"prepareOffsets",(function(e,n){var r=n.type;t.draggable=e,t.getDroppables(e.scope).forEach((function(t){t.refreshVisibility(),t.visible&&t.accept(e)&&("mouse:start"===r&&t.activate(n),t.refreshProportions());}));})),a(this,"onDragMove",(function(e,n){t.getDroppables(e.scope).forEach((function(t){var r=t.intersect(e,n);if(r&&!t.isOver||!r&&t.isOver){var o,i=t.element,a=t.options,s=a.greedy,l=a.scope;if(s){var u=Do(i).filter((function(e){return e[t.dataProperty]&&e[t.dataProperty].options.scope===l}));u.length>0&&((o=u[0][t.dataProperty]).greedyChild=r,r&&o.out(n));}r?t.over(n):t.out(n),o&&!r&&o.over(n);}}));})),a(this,"onDragStop",(function(e,n){t.prepareOffsets(e,n);})),a(this,"drop",(function(e,n){var r=null;return t.getDroppables(e.scope).forEach((function(t){t.intersect(e,n)&&(r=t.drop(n)||r),t.accept(e)&&t.deactivate(n);})),t.draggable=null,r}));});var Wo=Bo,Vo=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"scrollParent",null),a(c(o),"scrollParentOffset",null),a(c(o),"onDragStart",(function(e){if(o.scroll){var t=o.draggable.helperAttrs;o.scrollParent||(o.scrollParent=t.scrollParent),zo(o.scrollParent,!1)||(o.scrollParentOffset=V(o.scrollParent));}})),a(c(o),"onDragMove",(function(e){if(o.scroll){var t=!1,n=e.sensorEvent,r=c(o),i=r.scrollParent,a=r.scrollParentOffset,s=o.draggable.helperSize,l=o.draggable.offset.click,u=o.draggable.options,f=u.axis,p=u.scrollSensitivity,h=u.scrollSpeed,d=n.pageX-l.left-(zo(o.scrollParent,!1)?B(document):0),g=n.pageY-l.top-(zo(o.scrollParent,!1)?W(document):0);zo(o.scrollParent,!1)?(f&&"y"===f||(d<p?(B(document,B(document)-h),t=!0):window.innerWidth-(d+s.width)<p&&(B(document,B(document)+h),t=!0)),f&&"x"===f||(g<p?(W(document,W(document)-h),t=!0):window.innerHeight-(g+s.height)<p&&(W(document,W(document)+h),t=!0))):(f&&"y"===f||(a.left+i.offsetWidth-(d+s.width)<p?(i.scrollLeft=i.scrollLeft+h,t=!0):d-a.left<p&&(i.scrollLeft=i.scrollLeft-h,t=!0)),f&&"x"===f||(a.top+i.offsetHeight-(g+s.height)<p?(i.scrollTop=i.scrollTop+h,t=!0):g-a.top<p&&(i.scrollTop=i.scrollTop-h,t=!0))),t&&Wo.prepareOffsets(o.draggable,n);}})),o.attach(),o}return i(n,[{key:"scroll",get:function(){return this.draggable.options.scroll}}]),n}(y),qo=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"constraintPosition",(function(e){var t=o.draggable.startEvent;return "y"===o.axis?e.pageX=t.pageX:"x"===o.axis&&(e.pageY=t.pageY),e})),o.attach(),o}return i(n,[{key:"axis",get:function(){var e=this.draggable.options.axis;return void 0===e?null:e}}]),n}(y),Uo=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"sortable",get:function(){return this.data.sortable||null}}]),n}(So);a(Uo,"type","sortable");var $o=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Uo);a($o,"type","sortable:init");var Go=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"sensorEvent",get:function(){return this.data.sensorEvent||null}},{key:"draggable",get:function(){return this.data.draggable||null}},{key:"peerSortable",get:function(){return this.data.sortable||null}}]),n}(Uo);a(Go,"type","sortable:activate");var Ko=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Go);a(Ko,"type","sortable:over");var Zo=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Uo);a(Zo,"type","sortable:change");var Qo=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"item",get:function(){return this.data.item||null}},{key:"peerSortable",get:function(){return this.data.peerSortable||null}}]),n}(Uo);a(Qo,"type","sortable:remove");var Jo=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"draggable",get:function(){return this.data.draggable||null}}]),n}(Qo);a(Jo,"type","sortable:receive");var ei=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Uo);a(ei,"type","sortable:update");var ti=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Go);a(ti,"type","sortable:out");var ni=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Go);a(ni,"type","sortable:deactivate");var ri=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Uo);a(ri,"type","sortable:destroy");var oi="sortableInstance",ii=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"onDragStart",(function(e){o.connectToSortable&&(o.draggable.connectedSortables=[],F(document,o.connectToSortable).forEach((function(t){var n=t[oi];n&&!n.disabled&&(o.draggable.connectedSortables.push(n),n.refreshPositions(),n.trigger(new Go({sortable:n,sensorEvent:e.sensorEvent,draggable:o.draggable})));})));})),a(c(o),"onDragMove",(function(e){var t=e.sensorEvent;o.connectToSortable&&o.draggable.connectedSortables.forEach((function(n){var r=!1,i=o.draggable,a=i.helperSize,s=i.position,l=o.draggable.offset,u=l.click,c=l.parent;n.helperSize=a,n.offset.click=u,n.position.absolute=s.absolute,n.intersectsWith(n.elementProportions)&&(r=!0,o.draggable.connectedSortables.forEach((function(e){e.helperSize=a,e.offset.click=u,e.position.absolute=s.absolute,e!==n&&e.intersectsWith(e.elementProportions)&&Co(n.element,e.element)&&(r=!1);}))),r?(n.isDraggableOver||(o.draggable.previousHelperParent||(o.draggable.previousHelperParent=o.draggable.helper.parentNode),o.draggable.helper[oi]=n,n.element.appendChild(o.draggable.helper),n.previousHelper=n.options.helper,n.options.helper=function(){return o.draggable.helper},n.currentItem=o.draggable.helper,n.connectedDraggable=o.draggable,t.target=n.currentItem,n.over(null,o.draggable),n.isDraggableOver=!0,n.onDragStart({detail:t},!0,!0),n.offset.click=u,n.offset.parent.left-=c.left-n.offset.parent.left,n.offset.parent.top-=c.top-n.offset.parent.top,o.draggable.connectedSortables.forEach((function(e){return e.refreshPositions()}))),n.currentItem&&(n.onDragMove({detail:t},!1,!0),e.position=n.position.current)):!r&&n.isDraggableOver&&(n.previousRevert=n.options.revert,n.options.revert=!1,n.out(null,o.draggable),n.isDraggableOver=!1,n.cancelHelperRemoval=n.helper===n.currentItem,n.placeholder&&n.placeholder.parentNode.removeChild(n.placeholder),n.onDragStop({detail:t},!0),n.options.helper=n.previousHelper,n.previousHelper=null,n.options.revert=n.previousRevert,n.previousRevert=null,o.draggable.previousHelperParent.appendChild(o.draggable.helper),o.draggable.helper[oi]=null,o.draggable.calculateOffsets(t),o.draggable.calculatePosition(t),o.draggable.connectedSortables.forEach((function(e){return e.refreshPositions()})),e.position=o.draggable.position.current);}));})),a(c(o),"onDragStop",(function(e){var t=e.sensorEvent;o.connectToSortable&&(o.draggable.cancelHelperRemoval=!1,o.draggable.connectedSortables.forEach((function(n){n.isDraggableOver?(delete o.draggable.helper[oi],o.draggable.cancelHelperRemoval=!0,n.cancelHelperRemoval=!1,n.options.helper=n.previousHelper,n.previousHelper=null,n.previousRevert=n.options.revert,n.options.revert=!1,e.droppedSortable=n,n.out(null,o.draggable),n.isDraggableOver=!1,n.currentItemStyle={position:D(n.placeholder,"position"),left:Xo(n.placeholder,"left"),top:Xo(n.placeholder,"top")},n.onDragStop({detail:t},!0),n.options.revert=n.previousRevert,n.previousRevert=null,n.currentItem=null,n.connectedDraggable=null,o.draggable.helper[oi]=null,o.draggable.connectedSortables.forEach((function(e){return e.refreshPositions()}))):n.cancelHelperRemoval=!1,n.trigger(new ni({sortable:n,sensorEvent:t,draggable:o.draggable})),n.currentItem=null,n.connectedDraggable=null;})),o.draggable.connectedSortables=[]);})),o.attach(),o}return i(n,[{key:"connectToSortable",get:function(){return this.draggable.options.connectToSortable||null}}]),n}(y);Un({target:"Array",stat:!0},{isArray:Zn});var ai=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"constraintPosition",(function(e){if(o.containment){var t=d(o.containment,4),n=t[0],r=t[1],i=t[2],a=t[3],s=o.draggable.containmentContainer,l=o.draggable.offset.click;if(s){var u=V(s);n+=u.left,r+=u.top,i+=u.left,a+=u.top;}e.pageX-l.left<n&&(e.pageX=n+l.left),e.pageY-l.top<r&&(e.pageY=r+l.top),e.pageX-l.left>i&&(e.pageX=i+l.left),e.pageY-l.top>a&&(e.pageY=a+l.top);}return e})),o.attach(),o}return i(n,[{key:"containment",get:function(){if(void 0===this.draggable.containmentCoords){var e=this.draggable.options.containment,t=this.draggable.offset,n=t.parent,r=t.relative,o=this.draggable,i=o.helper,a=o.helperSize,s=o.margins;if("window"===e)this.draggable.containmentCoords=[window.pageXOffset-n.left-r.left,window.pageYOffset-n.top-r.top,window.pageXOffset+window.innerWidth-a.width-s.left,window.pageYOffset+window.innerHeight-a.height-s.top];else if("document"===e)this.draggable.containmentCoords=[0,0,Q(document)-a.width-s.left,q(document)-a.height-s.top];else if(Array.isArray(e)&&4===e.length)this.draggable.containmentCoords=e;else {var l="parent"===e?i.parentNode:document.querySelector(e);if(l){var u=/(scroll|auto)/.test(D(l,"overflow"));this.draggable.containmentContainer=l,this.draggable.containmentCoords=[Xo(l,"borderLeftWidth")+Xo(l,"paddingLeft"),Xo(l,"borderTopWidth")+Xo(l,"paddingTop"),(u?Math.max(l.scrollWidth,l.offsetWidth):l.offsetWidth)-Xo(l,"borderRightWidth")-Xo(l,"paddingRight")-a.width-s.left-s.right,(u?Math.max(l.scrollHeight,l.offsetHeight):l.offsetHeight)-Xo(l,"borderBottomWidth")-Xo(l,"paddingBottom")-a.height-s.top-s.bottom];}else this.draggable.containmentCoords=null;}}return this.draggable.containmentCoords}}]),n}(y),si=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"constraintPosition",(function(e){if(o.grid){var t,n,r,i,a=d(o.grid,2),s=a[0],l=a[1],u=o.draggable,c=u.containmentCoords,f=u.containmentContainer,p=u.startEvent,h=o.draggable.offset.click;if(c){var g=d(c,4);if(t=g[0],r=g[1],n=g[2],i=g[3],c&&f){var v=V(f);t+=v.left,r+=v.top,n+=v.left,i+=v.top;}}var m=s?p.pageX+Math.round((e.pageX-p.pageX)/s)*s:p.pageX,y=l?p.pageY+Math.round((e.pageY-p.pageY)/l)*l:p.pageY;c?(m-h.left>=t||m-h.left>n?e.pageX=m:e.pageX=m+s,y-h.top>=r||y-h.top>i?e.pageY=y:e.pageY=y+l):(e.pageX=m,e.pageY=y);}return e})),o.attach(),o}return i(n,[{key:"grid",get:function(){var e=this.draggable.options;return Array.isArray(e.grid)&&2===e.grid.length?e.grid:null}}]),n}(y),li=Math.floor,ui=function(e,t){var n=e.length,r=li(n/2);return n<8?ci(e,t):fi(ui(e.slice(0,r),t),ui(e.slice(r),t),t)},ci=function(e,t){for(var n,r,o=e.length,i=1;i<o;){for(r=i,n=e[i];r&&t(e[r-1],n)>0;)e[r]=e[--r];r!==i++&&(e[r]=n);}return e},fi=function(e,t,n){for(var r=e.length,o=t.length,i=0,a=0,s=[];i<r||a<o;)i<r&&a<o?s.push(n(e[i],t[a])<=0?e[i++]:t[a++]):s.push(i<r?e[i++]:t[a++]);return s},pi=ui,hi=Qn.match(/firefox\/(\d+)/i),di=!!hi&&+hi[1],gi=/MSIE|Trident/.test(Qn),vi=Qn.match(/AppleWebKit\/(\d+)\./),mi=!!vi&&+vi[1],yi=Un,bi=$n,wi=Se,Ei=nn,Si=ne,Pi=pi,ki=Nr,Oi=di,Ii=gi,Li=rr,xi=mi,Di=[],Ci=Di.sort,Mi=Si((function(){Di.sort(void 0);})),ji=Si((function(){Di.sort(null);})),Ti=ki("sort"),Ai=!Si((function(){if(Li)return Li<70;if(!(Oi&&Oi>3)){if(Ii)return !0;if(xi)return xi<603;var e,t,n,r,o="";for(e=65;e<76;e++){switch(t=String.fromCharCode(e),e){case 66:case 69:case 70:case 72:n=3;break;case 68:case 71:n=4;break;default:n=2;}for(r=0;r<47;r++)Di.push({k:t+r,v:n});}for(Di.sort((function(e,t){return t.v-e.v})),r=0;r<Di.length;r++)t=Di[r].k.charAt(0),o.charAt(o.length-1)!==t&&(o+=t);return "DGBEFHACIJK"!==o}}));yi({target:"Array",proto:!0,forced:Mi||!ji||!Ti||!Ai},{sort:function(e){void 0!==e&&bi(e);var t=wi(this);if(Ai)return void 0===e?Ci.call(t):Ci.call(t,e);var n,r,o=[],i=Ei(t.length);for(r=0;r<i;r++)r in t&&o.push(t[r]);for(n=(o=Pi(o,function(e){return function(t,n){return void 0===n?-1:void 0===t?1:void 0!==e?+e(t,n)||0:String(t)>String(n)?1:-1}}(e))).length,r=0;r<n;)t[r]=o[r++];for(;r<i;)delete t[r++];return t}});var Ni,Hi=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"onDragStart",(function(e){if(o.stack.length>0){var t=o.draggable.helper,n=o.stack.sort((function(e,t){return Xo(e,"zIndex")-Xo(t,"zIndex")})),r=Xo(n[0],"zIndex");n.forEach((function(e,t){D(e,{zIndex:r+t});})),D(t,{zIndex:r+n.length});}})),o.attach(),o}return i(n,[{key:"stack",get:function(){var e=this.draggable.options;return e.stack?F(document,e.stack):[]}}]),n}(y),Ri=mn,_i=yn,Fi=Object.keys||function(e){return Ri(e,_i)},Xi=Xe,Yi=ze,zi=Fi,Bi=re?Object.defineProperties:function(e,t){Yi(e);for(var n,r=zi(t),o=r.length,i=0;o>i;)Xi.f(e,n=r[i++],t[n]);return e},Wi=Gt("document","documentElement"),Vi=ze,qi=Bi,Ui=yn,$i=St,Gi=Wi,Ki=De,Zi=Et("IE_PROTO"),Qi=function(){},Ji=function(e){return "<script>"+e+"<\/script>"},ea=function(){try{Ni=document.domain&&new ActiveXObject("htmlfile");}catch(e){}var e,t;ea=Ni?function(e){e.write(Ji("")),e.close();var t=e.parentWindow.Object;return e=null,t}(Ni):((t=Ki("iframe")).style.display="none",Gi.appendChild(t),t.src=String("javascript:"),(e=t.contentWindow.document).open(),e.write(Ji("document.F=Object")),e.close(),e.F);for(var n=Ui.length;n--;)delete ea.prototype[Ui[n]];return ea()};$i[Zi]=!0;var ta=Object.create||function(e,t){var n;return null!==e?(Qi.prototype=Vi(e),n=new Qi,Qi.prototype=null,n[Zi]=e):n=ea(),void 0===t?n:qi(n,t)},na=Xe,ra=mr("unscopables"),oa=Array.prototype;null==oa[ra]&&na.f(oa,ra,{configurable:!0,value:ta(null)});var ia=Un,aa=xr.find,sa="find",la=!0;sa in[]&&Array(1).find((function(){la=!1;})),ia({target:"Array",proto:!0,forced:la},{find:function(e){return aa(this,e,arguments.length>1?arguments[1]:void 0)}}),function(e){oa[ra][e]=!0;}(sa);var ua=function(e){s(n,e);var t=p(n);function n(e,o){var i,s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;return r(this,n),a(c(i=t.call(this,e)),"property",null),a(c(i),"target",null),a(c(i),"previousValue",null),a(c(i),"onDragStart",(function(e){i.target||(i.target=i.draggable.helper),null===i.value||i.isSortableInDraggable()||(i.previousValue=i.getPreviousValue(),D(i.target,a({},i.property,i.value)));})),a(c(i),"onDragStop",(function(e){null!==i.previousValue&&(D(i.target,a({},i.property,i.previousValue)),i.target=null);})),i.property=o,i.target=s?s instanceof HTMLElement?s:document.querySelector(s):null,i.attach(),i}return i(n,[{key:"detach",value:function(){this.constructor.propertyCache=[],h(l(n.prototype),"detach",this).call(this);}},{key:"value",get:function(){var e=this.draggable.options;return this.property&&!m(e[this.property])?e[this.property]:null}},{key:"isSortableInDraggable",value:function(){return "sort:start"===this.startEvent&&this.draggable.connectedDraggable}},{key:"getPreviousValue",value:function(){var e=this,t=this.constructor.propertyCache,n=t.find((function(t){return t.element===e.target&&t.property===e.property}));return n||(n={element:this.target,property:this.property,value:D(this.target,this.property)},t.push(n)),n.value}}]),n}(y);a(ua,"propertyCache",[]);var ca=function(){function e(t){r(this,e),a(this,"caller",null),a(this,"active",!1),a(this,"lastEvent",null),this.caller=t;}return i(e,[{key:"attach",value:function(){}},{key:"detach",value:function(){}},{key:"cancel",value:function(e){}},{key:"trigger",value:function(e){var t=document.createEvent("Event");t.detail=e,t.initEvent(e.type,!0,!0),document.dispatchEvent(t),this.lastEvent=t;}}]),e}(),fa=function(e){e.preventDefault();},pa=function(e){s(n,e);var t=p(n);function n(e){var o;return r(this,n),a(c(o=t.call(this,e)),"pageX",null),a(c(o),"pageY",null),a(c(o),"startEvent",null),a(c(o),"mouseMoved",!1),a(c(o),"cancel",(function(e){o.onMouseUp(e);})),a(c(o),"onMouseDown",(function(e){1!==e.which||0!==e.button||e.ctrlKey||e.metaKey||o.caller.options.skip&&e.target.nodeName&&H(e.target,o.caller.options.skip)||(o.active&&o.onMouseUp(e),o.pageX=e.pageX,o.pageY=e.pageY,o.startEvent=e,document.addEventListener("dragstart",fa),document.addEventListener("mousemove",o.checkThresholds),document.addEventListener("mouseup",o.onMouseUp),e.preventDefault());})),a(c(o),"checkThresholds",(function(e){var t=c(o).startEvent,n=o.caller.options.distance;o.pageX=e.pageX,o.pageY=e.pageY,Math.max(Math.abs(e.pageX-t.pageX),Math.abs(e.pageY-t.pageY))>=n&&(document.removeEventListener("mousemove",o.checkThresholds),o.startDrag());})),a(c(o),"onMouseMove",(function(e){o.active&&o.trigger(new Oo({pageX:e.pageX,pageY:e.pageY,target:document.elementFromPoint(e.pageX,e.pageY),caller:o.caller,originalEvent:e}));})),a(c(o),"onMouseUp",(function(e){clearTimeout(o.startTimeout),document.removeEventListener("dragstart",fa),document.removeEventListener("mousemove",o.checkThresholds),document.removeEventListener("mouseup",o.onMouseUp),o.active&&(o.active=!1,o.trigger(new Io({pageX:e.pageX,pageY:e.pageY,target:document.elementFromPoint(e.pageX,e.pageY),caller:o.caller,originalEvent:e}))),document.removeEventListener("contextmenu",fa),document.removeEventListener("mousemove",o.onMouseMove),e.preventDefault();})),o.attach(),o}return i(n,[{key:"attach",value:function(){document.addEventListener("mousedown",this.onMouseDown,!0);}},{key:"detach",value:function(){document.removeEventListener("mousedown",this.onMouseDown,!0);}},{key:"startDrag",value:function(){var e=this.startEvent,t=new ko({pageX:e.pageX,pageY:e.pageY,target:e.target,caller:this.caller,originalEvent:e});this.trigger(t),this.active=!t.canceled,this.active&&(document.addEventListener("contextmenu",fa,!0),document.addEventListener("mousemove",this.onMouseMove));}}]),n}(ca),ha=xr.map;Un({target:"Array",proto:!0,forced:!jr("map")},{map:function(e){return ha(this,e,arguments.length>1?arguments[1]:void 0)}});var da=xr.some;Un({target:"Array",proto:!0,forced:!Nr("some")},{some:function(e){return da(this,e,arguments.length>1?arguments[1]:void 0)}});var ga=ee,va=[].slice,ma=function(e){return function(t,n){var r=arguments.length>2,o=r?va.call(arguments,2):void 0;return e(r?function(){("function"==typeof t?t:Function(t)).apply(this,o);}:t,n)}};Un({global:!0,bind:!0,forced:/MSIE .\./.test(Qn)},{setTimeout:ma(ga.setTimeout),setInterval:ma(ga.setInterval)});var ya={update:null,begin:null,loopBegin:null,changeBegin:null,change:null,changeComplete:null,loopComplete:null,complete:null,loop:1,direction:"normal",autoplay:!0,timelineOffset:0},ba={duration:1e3,delay:0,endDelay:0,easing:"easeOutElastic(1, .5)",round:0},wa=["translateX","translateY","translateZ","rotate","rotateX","rotateY","rotateZ","scale","scaleX","scaleY","scaleZ","skew","skewX","skewY","perspective","matrix","matrix3d"],Ea={CSS:{},springs:{}};function Sa(e,t,n){return Math.min(Math.max(e,t),n)}function Pa(e,t){return e.indexOf(t)>-1}function ka(e,t){return e.apply(null,t)}var Oa={arr:function(e){return Array.isArray(e)},obj:function(e){return Pa(Object.prototype.toString.call(e),"Object")},pth:function(e){return Oa.obj(e)&&e.hasOwnProperty("totalLength")},svg:function(e){return e instanceof SVGElement},inp:function(e){return e instanceof HTMLInputElement},dom:function(e){return e.nodeType||Oa.svg(e)},str:function(e){return "string"==typeof e},fnc:function(e){return "function"==typeof e},und:function(e){return void 0===e},nil:function(e){return Oa.und(e)||null===e},hex:function(e){return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(e)},rgb:function(e){return /^rgb/.test(e)},hsl:function(e){return /^hsl/.test(e)},col:function(e){return Oa.hex(e)||Oa.rgb(e)||Oa.hsl(e)},key:function(e){return !ya.hasOwnProperty(e)&&!ba.hasOwnProperty(e)&&"targets"!==e&&"keyframes"!==e}};function Ia(e){var t=/\(([^)]+)\)/.exec(e);return t?t[1].split(",").map((function(e){return parseFloat(e)})):[]}function La(e,t){var n=Ia(e),r=Sa(Oa.und(n[0])?1:n[0],.1,100),o=Sa(Oa.und(n[1])?100:n[1],.1,100),i=Sa(Oa.und(n[2])?10:n[2],.1,100),a=Sa(Oa.und(n[3])?0:n[3],.1,100),s=Math.sqrt(o/r),l=i/(2*Math.sqrt(o*r)),u=l<1?s*Math.sqrt(1-l*l):0,c=l<1?(l*s-a)/u:-a+s;function f(e){var n=t?t*e/1e3:e;return n=l<1?Math.exp(-n*l*s)*(1*Math.cos(u*n)+c*Math.sin(u*n)):(1+c*n)*Math.exp(-n*s),0===e||1===e?e:1-n}return t?f:function(){var t=Ea.springs[e];if(t)return t;for(var n=1/6,r=0,o=0;;)if(1===f(r+=n)){if(++o>=16)break}else o=0;var i=r*n*1e3;return Ea.springs[e]=i,i}}function xa(e){return void 0===e&&(e=10),function(t){return Math.ceil(Sa(t,1e-6,1)*e)*(1/e)}}var Da,Ca,Ma=function(){var e=.1;function t(e,t){return 1-3*t+3*e}function n(e,t){return 3*t-6*e}function r(e){return 3*e}function o(e,o,i){return ((t(o,i)*e+n(o,i))*e+r(o))*e}function i(e,o,i){return 3*t(o,i)*e*e+2*n(o,i)*e+r(o)}return function(t,n,r,a){if(0<=t&&t<=1&&0<=r&&r<=1){var s=new Float32Array(11);if(t!==n||r!==a)for(var l=0;l<11;++l)s[l]=o(l*e,t,r);return function(e){return t===n&&r===a||0===e||1===e?e:o(u(e),n,a)}}function u(n){for(var a=0,l=1;10!==l&&s[l]<=n;++l)a+=e;--l;var u=a+(n-s[l])/(s[l+1]-s[l])*e,c=i(u,t,r);return c>=.001?function(e,t,n,r){for(var a=0;a<4;++a){var s=i(t,n,r);if(0===s)return t;t-=(o(t,n,r)-e)/s;}return t}(n,u,t,r):0===c?u:function(e,t,n,r,i){var a,s,l=0;do{(a=o(s=t+(n-t)/2,r,i)-e)>0?n=s:t=s;}while(Math.abs(a)>1e-7&&++l<10);return s}(n,a,a+e,t,r)}}}(),ja=(Da={linear:function(){return function(e){return e}}},Ca={Sine:function(){return function(e){return 1-Math.cos(e*Math.PI/2)}},Circ:function(){return function(e){return 1-Math.sqrt(1-e*e)}},Back:function(){return function(e){return e*e*(3*e-2)}},Bounce:function(){return function(e){for(var t,n=4;e<((t=Math.pow(2,--n))-1)/11;);return 1/Math.pow(4,3-n)-7.5625*Math.pow((3*t-2)/22-e,2)}},Elastic:function(e,t){void 0===e&&(e=1),void 0===t&&(t=.5);var n=Sa(e,1,10),r=Sa(t,.1,2);return function(e){return 0===e||1===e?e:-n*Math.pow(2,10*(e-1))*Math.sin((e-1-r/(2*Math.PI)*Math.asin(1/n))*(2*Math.PI)/r)}}},["Quad","Cubic","Quart","Quint","Expo"].forEach((function(e,t){Ca[e]=function(){return function(e){return Math.pow(e,t+2)}};})),Object.keys(Ca).forEach((function(e){var t=Ca[e];Da["easeIn"+e]=t,Da["easeOut"+e]=function(e,n){return function(r){return 1-t(e,n)(1-r)}},Da["easeInOut"+e]=function(e,n){return function(r){return r<.5?t(e,n)(2*r)/2:1-t(e,n)(-2*r+2)/2}},Da["easeOutIn"+e]=function(e,n){return function(r){return r<.5?(1-t(e,n)(1-2*r))/2:(t(e,n)(2*r-1)+1)/2}};})),Da);function Ta(e,t){if(Oa.fnc(e))return e;var n=e.split("(")[0],r=ja[n],o=Ia(e);switch(n){case"spring":return La(e,t);case"cubicBezier":return ka(Ma,o);case"steps":return ka(xa,o);default:return ka(r,o)}}function Aa(e){try{return document.querySelectorAll(e)}catch(e){return}}function Na(e,t){for(var n=e.length,r=arguments.length>=2?arguments[1]:void 0,o=[],i=0;i<n;i++)if(i in e){var a=e[i];t.call(r,a,i,e)&&o.push(a);}return o}function Ha(e){return e.reduce((function(e,t){return e.concat(Oa.arr(t)?Ha(t):t)}),[])}function Ra(e){return Oa.arr(e)?e:(Oa.str(e)&&(e=Aa(e)||e),e instanceof NodeList||e instanceof HTMLCollection?[].slice.call(e):[e])}function _a(e,t){return e.some((function(e){return e===t}))}function Fa(e){var t={};for(var n in e)t[n]=e[n];return t}function Xa(e,t){var n=Fa(e);for(var r in e)n[r]=t.hasOwnProperty(r)?t[r]:e[r];return n}function Ya(e,t){var n=Fa(e);for(var r in t)n[r]=Oa.und(e[r])?t[r]:e[r];return n}function za(e){var t=/[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(e);if(t)return t[1]}function Ba(e,t){return Oa.fnc(e)?e(t.target,t.id,t.total):e}function Wa(e,t){return e.getAttribute(t)}function Va(e,t,n){if(_a([n,"deg","rad","turn"],za(t)))return t;var r=Ea.CSS[t+n];if(!Oa.und(r))return r;var o=document.createElement(e.tagName),i=e.parentNode&&e.parentNode!==document?e.parentNode:document.body;i.appendChild(o),o.style.position="absolute",o.style.width=100+n;var a=100/o.offsetWidth;i.removeChild(o);var s=a*parseFloat(t);return Ea.CSS[t+n]=s,s}function qa(e,t,n){if(t in e.style){var r=t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase(),o=e.style[t]||getComputedStyle(e).getPropertyValue(r)||"0";return n?Va(e,o,n):o}}function Ua(e,t){return Oa.dom(e)&&!Oa.inp(e)&&(!Oa.nil(Wa(e,t))||Oa.svg(e)&&e[t])?"attribute":Oa.dom(e)&&_a(wa,t)?"transform":Oa.dom(e)&&"transform"!==t&&qa(e,t)?"css":null!=e[t]?"object":void 0}function $a(e){if(Oa.dom(e)){for(var t,n=e.style.transform||"",r=/(\w+)\(([^)]*)\)/g,o=new Map;t=r.exec(n);)o.set(t[1],t[2]);return o}}function Ga(e,t,n,r){switch(Ua(e,t)){case"transform":return function(e,t,n,r){var o=Pa(t,"scale")?1:0+function(e){return Pa(e,"translate")||"perspective"===e?"px":Pa(e,"rotate")||Pa(e,"skew")?"deg":void 0}(t),i=$a(e).get(t)||o;return n&&(n.transforms.list.set(t,i),n.transforms.last=t),r?Va(e,i,r):i}(e,t,r,n);case"css":return qa(e,t,n);case"attribute":return Wa(e,t);default:return e[t]||0}}function Ka(e,t){var n=/^(\*=|\+=|-=)/.exec(e);if(!n)return e;var r=za(e)||0,o=parseFloat(t),i=parseFloat(e.replace(n[0],""));switch(n[0][0]){case"+":return o+i+r;case"-":return o-i+r;case"*":return o*i+r}}function Za(e,t){if(Oa.col(e))return function(e){return Oa.rgb(e)?(n=/rgb\((\d+,\s*[\d]+,\s*[\d]+)\)/g.exec(t=e))?"rgba("+n[1]+",1)":t:Oa.hex(e)?function(e){var t=e.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,(function(e,t,n,r){return t+t+n+n+r+r})),n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);return "rgba("+parseInt(n[1],16)+","+parseInt(n[2],16)+","+parseInt(n[3],16)+",1)"}(e):Oa.hsl(e)?function(e){var t,n,r,o=/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/g.exec(e)||/hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/g.exec(e),i=parseInt(o[1],10)/360,a=parseInt(o[2],10)/100,s=parseInt(o[3],10)/100,l=o[4]||1;function u(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+6*(t-e)*n:n<.5?t:n<2/3?e+(t-e)*(2/3-n)*6:e}if(0==a)t=n=r=s;else {var c=s<.5?s*(1+a):s+a-s*a,f=2*s-c;t=u(f,c,i+1/3),n=u(f,c,i),r=u(f,c,i-1/3);}return "rgba("+255*t+","+255*n+","+255*r+","+l+")"}(e):void 0;var t,n;}(e);if(/\s/g.test(e))return e;var n=za(e),r=n?e.substr(0,e.length-n.length):e;return t?r+t:r}function Qa(e,t){return Math.sqrt(Math.pow(t.x-e.x,2)+Math.pow(t.y-e.y,2))}function Ja(e){for(var t,n=e.points,r=0,o=0;o<n.numberOfItems;o++){var i=n.getItem(o);o>0&&(r+=Qa(t,i)),t=i;}return r}function es(e){if(e.getTotalLength)return e.getTotalLength();switch(e.tagName.toLowerCase()){case"circle":return function(e){return 2*Math.PI*Wa(e,"r")}(e);case"rect":return function(e){return 2*Wa(e,"width")+2*Wa(e,"height")}(e);case"line":return function(e){return Qa({x:Wa(e,"x1"),y:Wa(e,"y1")},{x:Wa(e,"x2"),y:Wa(e,"y2")})}(e);case"polyline":return Ja(e);case"polygon":return function(e){var t=e.points;return Ja(e)+Qa(t.getItem(t.numberOfItems-1),t.getItem(0))}(e)}}function ts(e,t){var n=t||{},r=n.el||function(e){for(var t=e.parentNode;Oa.svg(t)&&Oa.svg(t.parentNode);)t=t.parentNode;return t}(e),o=r.getBoundingClientRect(),i=Wa(r,"viewBox"),a=o.width,s=o.height,l=n.viewBox||(i?i.split(" "):[0,0,a,s]);return {el:r,viewBox:l,x:l[0]/1,y:l[1]/1,w:a,h:s,vW:l[2],vH:l[3]}}function ns(e,t,n){function r(n){void 0===n&&(n=0);var r=t+n>=1?t+n:0;return e.el.getPointAtLength(r)}var o=ts(e.el,e.svg),i=r(),a=r(-1),s=r(1),l=n?1:o.w/o.vW,u=n?1:o.h/o.vH;switch(e.property){case"x":return (i.x-o.x)*l;case"y":return (i.y-o.y)*u;case"angle":return 180*Math.atan2(s.y-a.y,s.x-a.x)/Math.PI}}function rs(e,t){var n=/[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,r=Za(Oa.pth(e)?e.totalLength:e,t)+"";return {original:r,numbers:r.match(n)?r.match(n).map(Number):[0],strings:Oa.str(e)||t?r.split(n):[]}}function os(e){return Na(e?Ha(Oa.arr(e)?e.map(Ra):Ra(e)):[],(function(e,t,n){return n.indexOf(e)===t}))}function is(e){var t=os(e);return t.map((function(e,n){return {target:e,id:n,total:t.length,transforms:{list:$a(e)}}}))}function as(e,t){var n=Fa(t);if(/^spring/.test(n.easing)&&(n.duration=La(n.easing)),Oa.arr(e)){var r=e.length;2!==r||Oa.obj(e[0])?Oa.fnc(t.duration)||(n.duration=t.duration/r):e={value:e};}var o=Oa.arr(e)?e:[e];return o.map((function(e,n){var r=Oa.obj(e)&&!Oa.pth(e)?e:{value:e};return Oa.und(r.delay)&&(r.delay=n?0:t.delay),Oa.und(r.endDelay)&&(r.endDelay=n===o.length-1?t.endDelay:0),r})).map((function(e){return Ya(e,n)}))}var ss={css:function(e,t,n){return e.style[t]=n},attribute:function(e,t,n){return e.setAttribute(t,n)},object:function(e,t,n){return e[t]=n},transform:function(e,t,n,r,o){if(r.list.set(t,n),t===r.last||o){var i="";r.list.forEach((function(e,t){i+=t+"("+e+") ";})),e.style.transform=i;}}};function ls(e,t){is(e).forEach((function(e){for(var n in t){var r=Ba(t[n],e),o=e.target,i=za(r),a=Ga(o,n,i,e),s=Ka(Za(r,i||za(a)),a),l=Ua(o,n);ss[l](o,n,s,e.transforms,!0);}}));}function us(e,t){return Na(Ha(e.map((function(e){return t.map((function(t){return function(e,t){var n=Ua(e.target,t.name);if(n){var r=function(e,t){var n;return e.tweens.map((function(r){var o=function(e,t){var n={};for(var r in e){var o=Ba(e[r],t);Oa.arr(o)&&1===(o=o.map((function(e){return Ba(e,t)}))).length&&(o=o[0]),n[r]=o;}return n.duration=parseFloat(n.duration),n.delay=parseFloat(n.delay),n}(r,t),i=o.value,a=Oa.arr(i)?i[1]:i,s=za(a),l=Ga(t.target,e.name,s,t),u=n?n.to.original:l,c=Oa.arr(i)?i[0]:u,f=za(c)||za(l),p=s||f;return Oa.und(a)&&(a=u),o.from=rs(c,p),o.to=rs(Ka(a,c),p),o.start=n?n.end:0,o.end=o.start+o.delay+o.duration+o.endDelay,o.easing=Ta(o.easing,o.duration),o.isPath=Oa.pth(i),o.isPathTargetInsideSVG=o.isPath&&Oa.svg(t.target),o.isColor=Oa.col(o.from.original),o.isColor&&(o.round=1),n=o,o}))}(t,e),o=r[r.length-1];return {type:n,property:t.name,animatable:e,tweens:r,duration:o.end,delay:r[0].delay,endDelay:o.endDelay}}}(e,t)}))}))),(function(e){return !Oa.und(e)}))}function cs(e,t){var n=e.length,r=function(e){return e.timelineOffset?e.timelineOffset:0},o={};return o.duration=n?Math.max.apply(Math,e.map((function(e){return r(e)+e.duration}))):t.duration,o.delay=n?Math.min.apply(Math,e.map((function(e){return r(e)+e.delay}))):t.delay,o.endDelay=n?o.duration-Math.max.apply(Math,e.map((function(e){return r(e)+e.duration-e.endDelay}))):t.endDelay,o}var fs=0,ps=[],hs=function(){var e;function t(n){for(var r=ps.length,o=0;o<r;){var i=ps[o];i.paused?(ps.splice(o,1),r--):(i.tick(n),o++);}e=o>0?requestAnimationFrame(t):void 0;}return "undefined"!=typeof document&&document.addEventListener("visibilitychange",(function(){gs.suspendWhenDocumentHidden&&(ds()?e=cancelAnimationFrame(e):(ps.forEach((function(e){return e._onDocumentVisibility()})),hs()));})),function(){e||ds()&&gs.suspendWhenDocumentHidden||!(ps.length>0)||(e=requestAnimationFrame(t));}}();function ds(){return !!document&&document.hidden}function gs(e){void 0===e&&(e={});var t,n=0,r=0,o=0,i=0,a=null;function s(e){var t=window.Promise&&new Promise((function(e){return a=e}));return e.finished=t,t}var l=function(e){var t=Xa(ya,e),n=Xa(ba,e),r=function(e,t){var n=[],r=t.keyframes;for(var o in r&&(t=Ya(function(e){for(var t=Na(Ha(e.map((function(e){return Object.keys(e)}))),(function(e){return Oa.key(e)})).reduce((function(e,t){return e.indexOf(t)<0&&e.push(t),e}),[]),n={},r=function(r){var o=t[r];n[o]=e.map((function(e){var t={};for(var n in e)Oa.key(n)?n==o&&(t.value=e[n]):t[n]=e[n];return t}));},o=0;o<t.length;o++)r(o);return n}(r),t)),t)Oa.key(o)&&n.push({name:o,tweens:as(t[o],e)});return n}(n,e),o=is(e.targets),i=us(o,r),a=cs(i,n),s=fs;return fs++,Ya(t,{id:s,children:[],animatables:o,animations:i,duration:a.duration,delay:a.delay,endDelay:a.endDelay})}(e);function u(){var e=l.direction;"alternate"!==e&&(l.direction="normal"!==e?"normal":"reverse"),l.reversed=!l.reversed,t.forEach((function(e){return e.reversed=l.reversed}));}function c(e){return l.reversed?l.duration-e:e}function f(){n=0,r=c(l.currentTime)*(1/gs.speed);}function p(e,t){t&&t.seek(e-t.timelineOffset);}function h(e){for(var t=0,n=l.animations,r=n.length;t<r;){var o=n[t],i=o.animatable,a=o.tweens,s=a.length-1,u=a[s];s&&(u=Na(a,(function(t){return e<t.end}))[0]||u);for(var c=Sa(e-u.start-u.delay,0,u.duration)/u.duration,f=isNaN(c)?1:u.easing(c),p=u.to.strings,h=u.round,d=[],g=u.to.numbers.length,v=void 0,m=0;m<g;m++){var y=void 0,b=u.to.numbers[m],w=u.from.numbers[m]||0;y=u.isPath?ns(u.value,f*b,u.isPathTargetInsideSVG):w+f*(b-w),h&&(u.isColor&&m>2||(y=Math.round(y*h)/h)),d.push(y);}var E=p.length;if(E){v=p[0];for(var S=0;S<E;S++){p[S];var P=p[S+1],k=d[S];isNaN(k)||(v+=P?k+P:k+" ");}}else v=d[0];ss[o.type](i.target,o.property,v,i.transforms),o.currentValue=v,t++;}}function d(e){l[e]&&!l.passThrough&&l[e](l);}function g(e){var f=l.duration,g=l.delay,v=f-l.endDelay,m=c(e);l.progress=Sa(m/f*100,0,100),l.reversePlayback=m<l.currentTime,t&&function(e){if(l.reversePlayback)for(var n=i;n--;)p(e,t[n]);else for(var r=0;r<i;r++)p(e,t[r]);}(m),!l.began&&l.currentTime>0&&(l.began=!0,d("begin")),!l.loopBegan&&l.currentTime>0&&(l.loopBegan=!0,d("loopBegin")),m<=g&&0!==l.currentTime&&h(0),(m>=v&&l.currentTime!==f||!f)&&h(f),m>g&&m<v?(l.changeBegan||(l.changeBegan=!0,l.changeCompleted=!1,d("changeBegin")),d("change"),h(m)):l.changeBegan&&(l.changeCompleted=!0,l.changeBegan=!1,d("changeComplete")),l.currentTime=Sa(m,0,f),l.began&&d("update"),e>=f&&(r=0,l.remaining&&!0!==l.remaining&&l.remaining--,l.remaining?(n=o,d("loopComplete"),l.loopBegan=!1,"alternate"===l.direction&&u()):(l.paused=!0,l.completed||(l.completed=!0,d("loopComplete"),d("complete"),!l.passThrough&&"Promise"in window&&(a(),s(l)))));}return s(l),l.reset=function(){var e=l.direction;l.passThrough=!1,l.currentTime=0,l.progress=0,l.paused=!0,l.began=!1,l.loopBegan=!1,l.changeBegan=!1,l.completed=!1,l.changeCompleted=!1,l.reversePlayback=!1,l.reversed="reverse"===e,l.remaining=l.loop,t=l.children;for(var n=i=t.length;n--;)l.children[n].reset();(l.reversed&&!0!==l.loop||"alternate"===e&&1===l.loop)&&l.remaining++,h(l.reversed?l.duration:0);},l._onDocumentVisibility=f,l.set=function(e,t){return ls(e,t),l},l.tick=function(e){o=e,n||(n=o),g((o+(r-n))*gs.speed);},l.seek=function(e){g(c(e));},l.pause=function(){l.paused=!0,f();},l.play=function(){l.paused&&(l.completed&&l.reset(),l.paused=!1,ps.push(l),f(),hs());},l.reverse=function(){u(),l.completed=!l.reversed,f();},l.restart=function(){l.reset(),l.play();},l.remove=function(e){ms(os(e),l);},l.reset(),l.autoplay&&l.play(),l}function vs(e,t){for(var n=t.length;n--;)_a(e,t[n].animatable.target)&&t.splice(n,1);}function ms(e,t){var n=t.animations,r=t.children;vs(e,n);for(var o=r.length;o--;){var i=r[o],a=i.animations;vs(e,a),a.length||i.children.length||r.splice(o,1);}n.length||r.length||t.pause();}gs.version="3.2.1",gs.speed=1,gs.suspendWhenDocumentHidden=!0,gs.running=ps,gs.remove=function(e){for(var t=os(e),n=ps.length;n--;)ms(t,ps[n]);},gs.get=Ga,gs.set=ls,gs.convertPx=Va,gs.path=function(e,t){var n=Oa.str(e)?Aa(e)[0]:e,r=t||100;return function(e){return {property:e,el:n,svg:ts(n),totalLength:es(n)*(r/100)}}},gs.setDashoffset=function(e){var t=es(e);return e.setAttribute("stroke-dasharray",t),t},gs.stagger=function(e,t){void 0===t&&(t={});var n=t.direction||"normal",r=t.easing?Ta(t.easing):null,o=t.grid,i=t.axis,a=t.from||0,s="first"===a,l="center"===a,u="last"===a,c=Oa.arr(e),f=c?parseFloat(e[0]):parseFloat(e),p=c?parseFloat(e[1]):0,h=za(c?e[1]:e)||0,d=t.start||0+(c?f:0),g=[],v=0;return function(e,t,m){if(s&&(a=0),l&&(a=(m-1)/2),u&&(a=m-1),!g.length){for(var y=0;y<m;y++){if(o){var b=l?(o[0]-1)/2:a%o[0],w=l?(o[1]-1)/2:Math.floor(a/o[0]),E=b-y%o[0],S=w-Math.floor(y/o[0]),P=Math.sqrt(E*E+S*S);"x"===i&&(P=-E),"y"===i&&(P=-S),g.push(P);}else g.push(Math.abs(a-y));v=Math.max.apply(Math,g);}r&&(g=g.map((function(e){return r(e/v)*v}))),"reverse"===n&&(g=g.map((function(e){return i?e<0?-1*e:-e:Math.abs(v-e)})));}return d+(c?(p-f)/v:f)*(Math.round(100*g[t])/100)+h}},gs.timeline=function(e){void 0===e&&(e={});var t=gs(e);return t.duration=0,t.add=function(n,r){var o=ps.indexOf(t),i=t.children;function a(e){e.passThrough=!0;}o>-1&&ps.splice(o,1);for(var s=0;s<i.length;s++)a(i[s]);var l=Ya(n,Xa(ba,e));l.targets=l.targets||e.targets;var u=t.duration;l.autoplay=!1,l.direction=t.direction,l.timelineOffset=Oa.und(r)?u:Ka(r,u),a(t),t.seek(l.timelineOffset);var c=gs(l);a(c),i.push(c);var f=cs(i,e);return t.delay=f.delay,t.endDelay=f.endDelay,t.duration=f.duration,t.seek(0),t.reset(),t.autoplay&&t.play(),t},t},gs.easing=Ta,gs.penner=ja,gs.random=function(e,t){return Math.floor(Math.random()*(t-e+1))+e};var ys=function(e,t,n){for(var r=-1,o=Object(e),i=n(e),a=i.length;a--;){var s=i[++r];if(!1===t(o[s],s,o))break}return e},bs="object"==typeof v&&v&&v.Object===Object&&v,ws=bs,Es="object"==typeof self&&self&&self.Object===Object&&self,Ss=ws||Es||Function("return this")(),Ps=Ss.Symbol,ks=Ps,Os=Object.prototype,Is=Os.hasOwnProperty,Ls=Os.toString,xs=ks?ks.toStringTag:void 0,Ds=Object.prototype.toString,Cs=function(e){var t=Is.call(e,xs),n=e[xs];try{e[xs]=void 0;var r=!0;}catch(e){}var o=Ls.call(e);return r&&(t?e[xs]=n:delete e[xs]),o},Ms=Ps?Ps.toStringTag:void 0,js=function(e){return null==e?void 0===e?"[object Undefined]":"[object Null]":Ms&&Ms in Object(e)?Cs(e):function(e){return Ds.call(e)}(e)},Ts=function(e){return null!=e&&"object"==typeof e},As=js,Ns=Ts,Hs=function(e){return Ns(e)&&"[object Arguments]"==As(e)},Rs=Ts,_s=Object.prototype,Fs=_s.hasOwnProperty,Xs=_s.propertyIsEnumerable,Ys=Hs(function(){return arguments}())?Hs:function(e){return Rs(e)&&Fs.call(e,"callee")&&!Xs.call(e,"callee")},zs=Array.isArray,Bs={exports:{}},Ws=function(){return !1};!function(e,t){var n=Ss,r=Ws,o=t&&!t.nodeType&&t,i=o&&e&&!e.nodeType&&e,a=i&&i.exports===o?n.Buffer:void 0,s=(a?a.isBuffer:void 0)||r;e.exports=s;}(Bs,Bs.exports);var Vs=/^(?:0|[1-9]\d*)$/,qs=function(e){return "number"==typeof e&&e>-1&&e%1==0&&e<=9007199254740991},Us=js,$s=qs,Gs=Ts,Ks={};Ks["[object Float32Array]"]=Ks["[object Float64Array]"]=Ks["[object Int8Array]"]=Ks["[object Int16Array]"]=Ks["[object Int32Array]"]=Ks["[object Uint8Array]"]=Ks["[object Uint8ClampedArray]"]=Ks["[object Uint16Array]"]=Ks["[object Uint32Array]"]=!0,Ks["[object Arguments]"]=Ks["[object Array]"]=Ks["[object ArrayBuffer]"]=Ks["[object Boolean]"]=Ks["[object DataView]"]=Ks["[object Date]"]=Ks["[object Error]"]=Ks["[object Function]"]=Ks["[object Map]"]=Ks["[object Number]"]=Ks["[object Object]"]=Ks["[object RegExp]"]=Ks["[object Set]"]=Ks["[object String]"]=Ks["[object WeakMap]"]=!1;var Zs={exports:{}};!function(e,t){var n=bs,r=t&&!t.nodeType&&t,o=r&&e&&!e.nodeType&&e,i=o&&o.exports===r&&n.process,a=function(){try{return o&&o.require&&o.require("util").types||i&&i.binding&&i.binding("util")}catch(e){}}();e.exports=a;}(Zs,Zs.exports);var Qs=function(e){return Gs(e)&&$s(e.length)&&!!Ks[Us(e)]},Js=function(e){return function(t){return e(t)}},el=Zs.exports,tl=el&&el.isTypedArray,nl=tl?Js(tl):Qs,rl=function(e,t){for(var n=-1,r=Array(e);++n<e;)r[n]=t(n);return r},ol=Ys,il=zs,al=Bs.exports,sl=function(e,t){var n=typeof e;return !!(t=null==t?9007199254740991:t)&&("number"==n||"symbol"!=n&&Vs.test(e))&&e>-1&&e%1==0&&e<t},ll=nl,ul=Object.prototype.hasOwnProperty,cl=Object.prototype,fl=function(e,t){return function(n){return e(t(n))}},pl=fl(Object.keys,Object),hl=function(e){var t=e&&e.constructor;return e===("function"==typeof t&&t.prototype||cl)},dl=pl,gl=Object.prototype.hasOwnProperty,vl=js,ml=function(e){if(!function(e){var t=typeof e;return null!=e&&("object"==t||"function"==t)}(e))return !1;var t=vl(e);return "[object Function]"==t||"[object GeneratorFunction]"==t||"[object AsyncFunction]"==t||"[object Proxy]"==t},yl=ml,bl=qs,wl=function(e){return null!=e&&bl(e.length)&&!yl(e)},El=function(e,t){var n=il(e),r=!n&&ol(e),o=!n&&!r&&al(e),i=!n&&!r&&!o&&ll(e),a=n||r||o||i,s=a?rl(e.length,String):[],l=s.length;for(var u in e)!t&&!ul.call(e,u)||a&&("length"==u||o&&("offset"==u||"parent"==u)||i&&("buffer"==u||"byteLength"==u||"byteOffset"==u)||sl(u,l))||s.push(u);return s},Sl=wl,Pl=ys,kl=function(e){return Sl(e)?El(e):function(e){if(!hl(e))return dl(e);var t=[];for(var n in Object(e))gl.call(e,n)&&"constructor"!=n&&t.push(n);return t}(e)},Ol=wl,Il=function(e){return e},Ll=function(e,t){for(var n=-1,r=null==e?0:e.length;++n<r&&!1!==t(e[n],n,e););return e},xl=function(e,t){if(null==e)return e;if(!Ol(e))return function(e,t){return e&&Pl(e,t,kl)}(e,t);for(var n=e.length,r=-1,o=Object(e);++r<n&&!1!==t(o[r],r,o););return e},Dl=zs,Cl=function(e,t){return (Dl(e)?Ll:xl)(e,function(e){return "function"==typeof e?e:Il}(t))},Ml=fl(Object.getPrototypeOf,Object),jl=js,Tl=Ml,Al=Ts,Nl=Function.prototype,Hl=Object.prototype,Rl=Nl.toString,_l=Hl.hasOwnProperty,Fl=Rl.call(Object),Xl=function(e){if(!Al(e)||"[object Object]"!=jl(e))return !1;var t=Tl(e);if(null===t)return !0;var n=_l.call(t,"constructor")&&t.constructor;return "function"==typeof n&&n instanceof n&&Rl.call(n)==Fl},Yl=Un,zl=ne,Bl=Zn,Wl=ye,Vl=Se,ql=nn,Ul=Qr,$l=Er,Gl=jr,Kl=rr,Zl=mr("isConcatSpreadable"),Ql=9007199254740991,Jl="Maximum allowed index exceeded",eu=Kl>=51||!zl((function(){var e=[];return e[Zl]=!1,e.concat()[0]!==e})),tu=Gl("concat"),nu=function(e){if(!Wl(e))return !1;var t=e[Zl];return void 0!==t?!!t:Bl(e)};Yl({target:"Array",proto:!0,forced:!eu||!tu},{concat:function(e){var t,n,r,o,i,a=Vl(this),s=$l(a,0),l=0;for(t=-1,r=arguments.length;t<r;t++)if(nu(i=-1===t?a:arguments[t])){if(l+(o=ql(i.length))>Ql)throw TypeError(Jl);for(n=0;n<o;n++,l++)n in i&&Ul(s,l,i[n]);}else {if(l>=Ql)throw TypeError(Jl);Ul(s,l++,i);}return s.length=l,s}});var ru,ou={exports:{}},iu="object"==typeof Reflect?Reflect:null,au=iu&&"function"==typeof iu.apply?iu.apply:function(e,t,n){return Function.prototype.apply.call(e,t,n)};ru=iu&&"function"==typeof iu.ownKeys?iu.ownKeys:Object.getOwnPropertySymbols?function(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:function(e){return Object.getOwnPropertyNames(e)};var su=Number.isNaN||function(e){return e!=e};function lu(){lu.init.call(this);}ou.exports=lu,ou.exports.once=function(e,t){return new Promise((function(n,r){function o(n){e.removeListener(t,i),r(n);}function i(){"function"==typeof e.removeListener&&e.removeListener("error",o),n([].slice.call(arguments));}yu(e,t,i,{once:!0}),"error"!==t&&function(e,t,n){"function"==typeof e.on&&yu(e,"error",t,{once:!0});}(e,o);}))},lu.EventEmitter=lu,lu.prototype._events=void 0,lu.prototype._eventsCount=0,lu.prototype._maxListeners=void 0;var uu=10;function cu(e){if("function"!=typeof e)throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof e)}function fu(e){return void 0===e._maxListeners?lu.defaultMaxListeners:e._maxListeners}function pu(e,t,n,r){var o,i,a,s;if(cu(n),void 0===(i=e._events)?(i=e._events=Object.create(null),e._eventsCount=0):(void 0!==i.newListener&&(e.emit("newListener",t,n.listener?n.listener:n),i=e._events),a=i[t]),void 0===a)a=i[t]=n,++e._eventsCount;else if("function"==typeof a?a=i[t]=r?[n,a]:[a,n]:r?a.unshift(n):a.push(n),(o=fu(e))>0&&a.length>o&&!a.warned){a.warned=!0;var l=new Error("Possible EventEmitter memory leak detected. "+a.length+" "+String(t)+" listeners added. Use emitter.setMaxListeners() to increase limit");l.name="MaxListenersExceededWarning",l.emitter=e,l.type=t,l.count=a.length,s=l,console&&console.warn&&console.warn(s);}return e}function hu(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function du(e,t,n){var r={fired:!1,wrapFn:void 0,target:e,type:t,listener:n},o=hu.bind(r);return o.listener=n,r.wrapFn=o,o}function gu(e,t,n){var r=e._events;if(void 0===r)return [];var o=r[t];return void 0===o?[]:"function"==typeof o?n?[o.listener||o]:[o]:n?function(e){for(var t=new Array(e.length),n=0;n<t.length;++n)t[n]=e[n].listener||e[n];return t}(o):mu(o,o.length)}function vu(e){var t=this._events;if(void 0!==t){var n=t[e];if("function"==typeof n)return 1;if(void 0!==n)return n.length}return 0}function mu(e,t){for(var n=new Array(t),r=0;r<t;++r)n[r]=e[r];return n}function yu(e,t,n,r){if("function"==typeof e.on)r.once?e.once(t,n):e.on(t,n);else {if("function"!=typeof e.addEventListener)throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof e);e.addEventListener(t,(function o(i){r.once&&e.removeEventListener(t,o),n(i);}));}}Object.defineProperty(lu,"defaultMaxListeners",{enumerable:!0,get:function(){return uu},set:function(e){if("number"!=typeof e||e<0||su(e))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+e+".");uu=e;}}),lu.init=function(){void 0!==this._events&&this._events!==Object.getPrototypeOf(this)._events||(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0;},lu.prototype.setMaxListeners=function(e){if("number"!=typeof e||e<0||su(e))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+e+".");return this._maxListeners=e,this},lu.prototype.getMaxListeners=function(){return fu(this)},lu.prototype.emit=function(e){for(var t=[],n=1;n<arguments.length;n++)t.push(arguments[n]);var r="error"===e,o=this._events;if(void 0!==o)r=r&&void 0===o.error;else if(!r)return !1;if(r){var i;if(t.length>0&&(i=t[0]),i instanceof Error)throw i;var a=new Error("Unhandled error."+(i?" ("+i.message+")":""));throw a.context=i,a}var s=o[e];if(void 0===s)return !1;if("function"==typeof s)au(s,this,t);else {var l=s.length,u=mu(s,l);for(n=0;n<l;++n)au(u[n],this,t);}return !0},lu.prototype.addListener=function(e,t){return pu(this,e,t,!1)},lu.prototype.on=lu.prototype.addListener,lu.prototype.prependListener=function(e,t){return pu(this,e,t,!0)},lu.prototype.once=function(e,t){return cu(t),this.on(e,du(this,e,t)),this},lu.prototype.prependOnceListener=function(e,t){return cu(t),this.prependListener(e,du(this,e,t)),this},lu.prototype.removeListener=function(e,t){var n,r,o,i,a;if(cu(t),void 0===(r=this._events))return this;if(void 0===(n=r[e]))return this;if(n===t||n.listener===t)0==--this._eventsCount?this._events=Object.create(null):(delete r[e],r.removeListener&&this.emit("removeListener",e,n.listener||t));else if("function"!=typeof n){for(o=-1,i=n.length-1;i>=0;i--)if(n[i]===t||n[i].listener===t){a=n[i].listener,o=i;break}if(o<0)return this;0===o?n.shift():function(e,t){for(;t+1<e.length;t++)e[t]=e[t+1];e.pop();}(n,o),1===n.length&&(r[e]=n[0]),void 0!==r.removeListener&&this.emit("removeListener",e,a||t);}return this},lu.prototype.off=lu.prototype.removeListener,lu.prototype.removeAllListeners=function(e){var t,n,r;if(void 0===(n=this._events))return this;if(void 0===n.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==n[e]&&(0==--this._eventsCount?this._events=Object.create(null):delete n[e]),this;if(0===arguments.length){var o,i=Object.keys(n);for(r=0;r<i.length;++r)"removeListener"!==(o=i[r])&&this.removeAllListeners(o);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if("function"==typeof(t=n[e]))this.removeListener(e,t);else if(void 0!==t)for(r=t.length-1;r>=0;r--)this.removeListener(e,t[r]);return this},lu.prototype.listeners=function(e){return gu(this,e,!0)},lu.prototype.rawListeners=function(e){return gu(this,e,!1)},lu.listenerCount=function(e,t){return "function"==typeof e.listenerCount?e.listenerCount(t):vu.call(e,t)},lu.prototype.listenerCount=vu,lu.prototype.eventNames=function(){return this._eventsCount>0?ru(this._events):[]};var bu=function(e){s(n,e);var t=p(n);function n(){var e;r(this,n);for(var o=arguments.length,i=new Array(o),s=0;s<o;s++)i[s]=arguments[s];return a(c(e=t.call.apply(t,[this].concat(i))),"wrappedListeners",[]),e}return i(n,[{key:"wrapListener",value:function(e){var t=this.wrappedListeners.find((function(t){return t.listener===e}));return t?this.wrappedListeners=this.wrappedListeners.filter((function(e){return e!==t})):(t={listener:e,wrapped:function(t){t&&t.canceled||e(t);}},this.wrappedListeners.push(t)),t}},{key:"addListener",value:function(e,t){h(l(n.prototype),"addListener",this).call(this,e,this.wrapListener(t));}},{key:"prependListener",value:function(e,t){h(l(n.prototype),"prependListener",this).call(this,e,this.wrapListener(t));}},{key:"removeListener",value:function(e,t){h(l(n.prototype),"off",this).call(this,e,this.wrapListener(t));}}]),n}(ou.exports),wu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"draggable",get:function(){return this.data.draggable||null}}]),n}(So);a(wu,"type","draggable");var Eu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(wu);a(Eu,"type","draggable:init");var Su=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(wu);a(Su,"type","draggable:destroy");var Pu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"source",get:function(){return this.data.source||null}},{key:"helper",get:function(){return this.data.helper||null}},{key:"sensorEvent",get:function(){return this.data.sensorEvent||null}},{key:"originalEvent",get:function(){return this.data.originalEvent||null}}]),n}(So);a(Pu,"type","drag");var ku=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Pu);a(ku,"type","drag:start"),a(ku,"cancelable",!0);var Ou=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"position",get:function(){return this.data.position||null},set:function(e){this.data.position=e;}}]),n}(Pu);a(Ou,"type","drag:move"),a(Ou,"cancelable",!0);var Iu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"droppable",get:function(){return this.data.droppable||null},set:function(e){this.data.droppable=e;}}]),n}(Pu);a(Iu,"type","drag:stop"),a(Iu,"cancelable",!0);var Lu=function(){function e(t){var o=this,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};if(r(this,e),a(this,"element",null),a(this,"margins",null),a(this,"dragging",!1),a(this,"reverting",!1),a(this,"helper",null),a(this,"helperSize",null),a(this,"helperAttrs",null),a(this,"startEvent",null),a(this,"offset",{element:null,click:null,scroll:null,parent:null,relative:null}),a(this,"position",{original:null,current:null,absolute:null}),a(this,"emitter",new bu),a(this,"options",{}),a(this,"plugins",[]),a(this,"sensors",[]),a(this,"pendingDestroy",!1),a(this,"cancelHelperRemoval",!1),a(this,"containmentCoords",void 0),a(this,"containmentContainer",null),a(this,"scrollListeners",[]),a(this,"connectedSortables",[]),a(this,"droppedSortable",null),a(this,"setup",(function(){o.addPlugin(new qo(o)),o.addPlugin(new ai(o)),o.addPlugin(new si(o)),o.addPlugin(new ua(o,"cursor")),o.addPlugin(new ua(o,"opacity")),o.addPlugin(new ua(o,"zIndex")),o.addPlugin(new Hi(o)),o.addPlugin(new Vo(o)),o.addPlugin(new ii(o)),o.addSensor(new pa(o)),document.addEventListener("mouse:start",o.onDragStart),document.addEventListener("mouse:move",o.onDragMove),document.addEventListener("mouse:stop",o.onDragStop),"original"===o.options.helper&&_o(o.element),o.element[o.dataProperty]=o,w(o.element,o.elementClass),o.findHandles().forEach((function(e){w(e,o.handleClass);})),o.trigger(new Eu({draggable:o}));})),a(this,"onDragStart",(function(e){var t=e.detail;if(t.caller===o)if(o.disabled||o.reverting)t.cancel();else if(o.isInsideHandle(t)){if(Ho(t),o.helper=o.createHelper(t),!o.helper)return t.cancel(),void o.clear();w(o.helper,o.helperClass),o.cacheMargins(),o.dragging=!0,o.cacheHelperSize(),o.cacheHelperAttrs(),o.startEvent=t,o.position.absolute=V(o.element),o.calculateOffsets(t),o.calculatePosition(t,!1);var n=new ku({source:o.element,helper:o.helper,sensorEvent:t,originalEvent:t.originalEvent});if(o.trigger(n),n.canceled)return t.cancel(),void o.clear();o.cacheHelperSize(),Wo.prepareOffsets(o,t),o.onDragMove(e,!0),o.scrollListeners=Do(o.element,"body").map((function(t){return C(t,"scroll",(function(){return Wo.prepareOffsets(o,e)}))}));}else t.cancel();})),a(this,"onDragMove",(function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],n=e.detail;if(n.caller===o){var r=o.helperAttrs.hasFixedParent;r&&(o.offset.parent=o.getParentOffset()),o.calculatePosition(n);var i=new Ou({source:o.element,helper:o.helper,sensorEvent:n,originalEvent:n.originalEvent,position:o.position.current});t?o.plugins.forEach((function(e){i.canceled||e.onDragMove(i);})):o.trigger(i),i.canceled?o.onDragCancel(To(o.helper)):(o.position.current=i.position,D(o.helper,{left:o.position.current.left+"px",top:o.position.current.top+"px"}),Wo.onDragMove(o,n));}})),a(this,"onDragCancel",(function(e){var t=e.detail;o.scrollListeners.forEach((function(e){return e()})),o.scrollListeners=[],Wo.onDragStop(o,t),o.findHandles().some((function(e){return e===t.target}))&&No(o.element,"focus"),o.sensors.forEach((function(t){return t.cancel(e)}));})),a(this,"onDragStop",(function(e){var t=e.detail;if(t.caller===o){var n=o.options,r=n.revert,i=n.revertDuration,a=o.position.original,s=new Iu({source:o.element,helper:o.helper,droppable:Wo.drop(o,t),sensorEvent:t,originalEvent:t.originalEvent});"invalid"===r&&!s.droppable||"valid"===r&&s.droppable||ml(r)&&r(o.element,s.droppable)||r?(o.reverting=!0,gs({targets:[o.helper],left:a.left+"px",top:a.top+"px",duration:i,easing:"linear",complete:function(){o.reverting=!1,o.trigger(s),s.canceled||o.clear();}})):(o.trigger(s),s.canceled||o.clear());}})),!(t instanceof HTMLElement))throw new Error("Invalid element");this.element=t,this.options=n(n({},this.constructor.defaultOptions),Xl(i)?i:{}),Xl(s)&&Cl(s,(function(e,t){o.on(t,e);})),setTimeout((function(){o.setup();}),0);}return i(e,[{key:"addPlugin",value:function(e){e instanceof y&&this.plugins.push(e);}},{key:"addSensor",value:function(e){e instanceof ca&&this.sensors.push(e);}},{key:"setDisabled",value:function(e){this.options.disabled=!!e;}},{key:"on",value:function(e,t){this.emitter.on(e,t);}},{key:"off",value:function(e,t){this.emitter.off(e,t);}},{key:"cancel",value:function(){this.dragging?this.onDragCancel(To(this.helper)):this.clear();}},{key:"destroy",value:function(){var e=this;this.dragging?this.pendingDestroy=!0:(this.plugins.forEach((function(e){return e.detach()})),this.sensors.forEach((function(e){return e.detach()})),document.removeEventListener("mouse:start",this.onDragStart),document.removeEventListener("mouse:move",this.onDragMove),document.removeEventListener("mouse:stop",this.onDragStop),delete this.element[this.dataProperty],K(this.element,this.elementClass),this.findHandles().forEach((function(t){K(t,e.handleClass);})),this.trigger(new Su({draggable:this})));}},{key:"disabled",get:function(){return this.options.disabled}},{key:"dataProperty",get:function(){return "draggableInstance"}},{key:"elementClass",get:function(){return "ui-draggable"}},{key:"handleClass",get:function(){return "ui-draggable-handle"}},{key:"helperClass",get:function(){return "ui-draggable-helper"}},{key:"scope",get:function(){return this.options.scope}},{key:"proportions",get:function(){var e=this.position.absolute,t=this.margins,n=this.helperSize;return {left:e.left+t.left,top:e.top+t.top,right:e.left+t.left+n.width,bottom:e.top+t.top+n.height,width:n.width,height:n.height}}},{key:"trigger",value:function(e){this.emitter.emit(e.type,e),/^drag:/.test(e.type)&&(this.position.absolute=this.convertPosition(this.position.current,"absolute"));}},{key:"findHandles",value:function(){var e=this.options.handle;return e?F(this.element,e):[this.element]}},{key:"isInsideHandle",value:function(e){var t=!1;return this.findHandles().forEach((function(n){t||n!==e.target&&!Co(n,e.target)||(t=!0);})),t}},{key:"createHelper",value:function(e){var t=null,n=this.options,r=n.appendTo,o=n.helper;if(ml(o)?t=o.apply(this.element,[e]):"clone"===o?((t=this.element.cloneNode(!0)).removeAttribute("id"),t.removeAttribute(this.dataProperty),t[this.dataProperty]=this):t=this.element,t instanceof HTMLElement){if(!H(t,"body")){var i="parent"===r?this.element.parentNode:document.querySelector(r);i instanceof HTMLElement&&i.appendChild(t);}return ml(o)&&t===this.element&&_o(this.element),t!==this.element&&Fo(t),t}return null}},{key:"cacheMargins",value:function(){this.margins={left:parseInt(D(this.element,"marginLeft"),10)||0,top:parseInt(D(this.element,"marginTop"),10)||0,right:parseInt(D(this.element,"marginRight"),10)||0,bottom:parseInt(D(this.element,"marginBottom"),10)||0};}},{key:"cacheHelperSize",value:function(){this.helperSize={width:Q(this.helper),height:q(this.helper)};}},{key:"cacheHelperAttrs",value:function(){this.helperAttrs={cssPosition:D(this.helper,"position"),scrollParent:Yo(this.helper,!1),offsetParent:U(this.helper),hasFixedParent:Do(this.helper).some((function(e){return "fixed"===D(e,"position")}))};}},{key:"calculateOffsets",value:function(e){var t=this.position.absolute;this.offset.click={left:e.pageX-t.left-this.margins.left,top:e.pageY-t.top-this.margins.top},this.offset.parent=this.getParentOffset(),this.offset.relative=this.getRelativeOffset();}},{key:"getParentOffset",value:function(){var e=this.helperAttrs,t=e.cssPosition,n=e.scrollParent,r=e.offsetParent,o=zo(r)?{left:0,top:0}:V(r);return "absolute"===t&&n!==document&&Co(n,r)&&(o.left+=B(n),o.top+=W(n)),{left:o.left+parseInt(D(r,"borderLeftWidth"),10)||0,top:o.top+parseInt(D(r,"borderTopWidth"),10)||0}}},{key:"getRelativeOffset",value:function(){var e=this.helperAttrs,t=e.cssPosition,n=e.scrollParent;if("relative"!==t)return {left:0,top:0};var r=function(e,t){var n,r={top:0,left:0};if("fixed"===D(e,"position"))n=e.getBoundingClientRect();else {var o=U(e);n=V(e),"html"!==function(e){return e.nodeName&&e.nodeName.toLowerCase()}(o)&&(r=V(o));var i=String(D(o,"borderTopWidth")||0);r.top+=parseInt(i,10)-W(o)||0;var a=String(D(o,"borderLeftWidth")||0);r.left+=parseInt(a,10)-B(o)||0;}var s=String(D(e,"marginTop")||0),l=String(D(e,"marginLeft")||0);return $({},n,{top:n.top-r.top-(parseInt(s,10)||0),left:n.left-r.left-(parseInt(l,10)||0)})}(this.helper),o=!!n&&zo(n);return {left:r.left-(parseInt(D(this.helper,"left"),10)||0)+(o?B(n):0),top:r.top-(parseInt(D(this.helper,"top"),10)||0)+(o?W(n):0)}}},{key:"constraintPosition",value:function(e){var t={pageX:e.pageX,pageY:e.pageY};return this.plugins.forEach((function(e){t=e.constraintPosition(t);})),t}},{key:"calculatePosition",value:function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],n=t?this.constraintPosition(e):e,r=n.pageX,o=n.pageY,i=this.helperAttrs,a=i.cssPosition,s=i.offsetParent,l=i.scrollParent,u=zo(l);u&&this.offset.scroll||(this.offset.scroll={left:u?0:B(l),top:u?0:W(l)}),"relative"===a&&l===document&&l!==s&&(this.offset.relative=this.getRelativeOffset());var c=this.offset,f=c.click,p=c.scroll,h=c.parent,d=c.relative,g={left:r-f.left-h.left-d.left+("fixed"===a?-p.left:u?0:p.left),top:o-f.top-h.top-d.top+("fixed"===a?-p.top:u?0:p.top)};this.position.original||(this.position.original=g),this.position.current=g,this.position.absolute=this.convertPosition(g,"absolute");}},{key:"convertPosition",value:function(e,t){var n=this.helperAttrs,r=n.cssPosition,o=n.scrollParent,i=this.offset,a=i.scroll,s=i.parent,l=i.relative,u="absolute"===t?1:-1,c=zo(o);return {left:e.left+s.left*u+l.left*u-("fixed"===r?-a.left:(c?0:a.left)*u),top:e.top+s.top*u+l.top*u-("fixed"===r?-a.top:(c?0:a.top)*u)}}},{key:"clear",value:function(){if(this.helper){var e=this.options.helper;K(this.helper,this.helperClass),this.dragging=!1,this.helper&&"clone"===e&&!this.cancelHelperRemoval&&this.helper.parentNode.removeChild(this.helper),this.cancelHelperRemoval=!1,this.helper=null,this.pendingDestroy&&(this.destroy(),this.pendingDestroy=!1);}}}]),e}();a(Lu,"defaultOptions",{appendTo:"parent",axis:null,connectToSortable:null,containment:null,cursor:null,disabled:!1,distance:0,grid:null,handle:null,helper:"original",opacity:null,revert:!1,revertDuration:200,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:10,stack:null,skip:"input, textarea, button, select, option",zIndex:null});var xu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"droppable",get:function(){return this.data.droppable||null}}]),n}(So);a(xu,"type","droppable");var Du=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(xu);a(Du,"type","droppable:init");var Cu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"sensorEvent",get:function(){return this.data.sensorEvent||null}},{key:"draggable",get:function(){return this.data.draggable||null}}]),n}(xu);a(Cu,"type","droppable:activate");var Mu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Cu);a(Mu,"type","droppable:over");var ju=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Cu);a(ju,"type","droppable:drop");var Tu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Cu);a(Tu,"type","droppable:out");var Au=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Cu);a(Au,"type","droppable:deactivate");var Nu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(xu);a(Nu,"type","droppable:destroy");var Hu=function(){function e(t){var o=this,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};if(r(this,e),a(this,"element",null),a(this,"isOver",!1),a(this,"visible",!0),a(this,"greedyChild",!1),a(this,"emitter",new bu),a(this,"options",{}),a(this,"size",null),a(this,"offset",null),a(this,"setup",(function(){var e=o.options.scope;o.element[o.dataProperty]=o,w(o.element,o.elementClass),Wo.addDroppable(o,e),o.trigger(new Du({droppable:o}));})),!(t instanceof HTMLElement))throw new Error("Invalid element");this.element=t,this.options=n(n({},this.constructor.defaultOptions),Xl(i)?i:{}),Xl(s)&&Cl(s,(function(e,t){o.on(t,e);})),setTimeout(this.setup,0);}return i(e,[{key:"setDisabled",value:function(e){this.options.disabled=!!e;}},{key:"destroy",value:function(){var e=this.options.scope;delete this.element[this.dataProperty],K(this.element,this.elementClass),Wo.removeDroppable(this,e),this.trigger(new Nu({droppable:this}));}},{key:"disabled",get:function(){return this.options.disabled}},{key:"dataProperty",get:function(){return "droppableInstance"}},{key:"elementClass",get:function(){return "ui-droppable"}},{key:"activeClass",get:function(){return "ui-droppable-active"}},{key:"hoverClass",get:function(){return "ui-droppable-hover"}},{key:"greedy",get:function(){return this.options.greedy}},{key:"scope",get:function(){return this.options.scope}},{key:"proportions",get:function(){return this.offset||(this.offset=V(this.element)),this.size||(this.size={width:Q(this.element),height:q(this.element)}),{left:this.offset.left,top:this.offset.top,right:this.offset.left+this.size.width,bottom:this.offset.top+this.size.height,width:this.size.width,height:this.size.height}}},{key:"refreshVisibility",value:function(){this.visible="none"!==D(this.element,"display");}},{key:"refreshProportions",value:function(){this.offset=V(this.element),this.size={width:Q(this.element),height:q(this.element)};}},{key:"intersect",value:function(e,t){var n=this.options.tolerance;return !(this.disabled||this.greedyChild||!this.visible)&&function(e,t,n,r){switch(n){case"fit":return e.left>=t.left&&e.top>=t.top&&e.right>=t.right&&e.bottom>=t.bottom;case"intersect":return t.left<e.left+e.width/2&&t.right>e.right-e.width/2&&t.top<e.top+e.height/2&&t.bottom>e.bottom-e.height/2;case"pointer":return r.pageX>t.left&&r.pageX<t.right&&r.pageY>t.top&&r.pageY<t.bottom;case"touch":return (e.left>=t.left&&e.left<=t.right||e.right>=t.left&&e.right<=t.right||e.left<t.left&&e.right>t.right)&&(e.top>=t.top&&e.top<=t.top||e.bottom>=t.bottom&&e.bottom<=t.bottom||e.top<t.top&&e.bottom>t.bottom);default:return !1}}(e.proportions,this.proportions,n,t)}},{key:"accept",value:function(e){var t=this.options.accept;return !(this.disabled||!this.visible)&&!!e&&(ml(t)?t(e.currentItem||e.element):N(e.currentItem||e.element,t))}},{key:"activate",value:function(e){var t=Wo.draggable;w(this.element,this.activeClass),t&&this.trigger(new Cu({droppable:this,sensorEvent:e,draggable:t}));}},{key:"over",value:function(e){var t=Wo.draggable;t&&(t.currentItem||t.element)!==this.element&&this.accept(t)&&(w(this.element,this.hoverClass),this.isOver=!0,this.trigger(new Mu({droppable:this,sensorEvent:e,draggable:t})));}},{key:"drop",value:function(e){var t=this,n=Wo.draggable,r=!1;if(n&&(n.currentItem&&n.element)!==this.element){if(F(this.element,":not(.ui-draggable-dragging)").filter((function(e){return e[t.dataProperty]})).forEach((function(o){var i=o[t.dataProperty];!r&&i.greedy&&i.scope===n.scope&&i.intersect(n,e)&&i.accept(n)&&(r=!0);})),r)return null;if(this.accept(n))return K(this.element,this.activeClass),K(this.element,this.hoverClass),this.isOver=!1,this.trigger(new ju({droppable:this,sensorEvent:e,draggable:n})),this}return null}},{key:"out",value:function(e){var t=Wo.draggable;t&&(t.currentItem||t.element)!==this.element&&this.accept(t)&&(K(this.element,this.hoverClass),this.isOver=!1,this.trigger(new Tu({droppable:this,sensorEvent:e,draggable:t})));}},{key:"deactivate",value:function(e){var t=Wo.draggable;K(this.element,this.activeClass),this.isOver=!1,t&&this.trigger(new Au({droppable:this,sensorEvent:e,draggable:t}));}},{key:"on",value:function(e,t){this.emitter.on(e,t);}},{key:"off",value:function(e,t){this.emitter.off(e,t);}},{key:"trigger",value:function(e){this.emitter.emit(e.type,e);}}]),e}();a(Hu,"defaultOptions",{accept:"*",disabled:!1,greedy:!1,scope:"default",tolerance:"intersect"});var Ru=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"source",get:function(){return this.data.source||null}},{key:"helper",get:function(){return this.data.helper||null}},{key:"placeholder",get:function(){return this.data.placeholder||null}},{key:"sensorEvent",get:function(){return this.data.sensorEvent||null}},{key:"originalEvent",get:function(){return this.data.originalEvent||null}}]),n}(So);a(Ru,"type","sort");var _u=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return n}(Ru);a(_u,"type","sort:start"),a(_u,"cancelable",!0);var Fu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"position",get:function(){return this.data.position||null}}]),n}(Ru);a(Fu,"type","sort:move"),a(Fu,"cancelable",!0);var Xu=function(e){s(n,e);var t=p(n);function n(){return r(this,n),t.apply(this,arguments)}return i(n,[{key:"droppable",get:function(){return this.data.droppable||null}}]),n}(Ru);a(Xu,"type","sort:stop"),a(Xu,"cancelable",!0);var Yu=function(e){s(n,e);var t=p(n);function n(){var e;r(this,n);for(var o=arguments.length,i=new Array(o),s=0;s<o;s++)i[s]=arguments[s];return a(c(e=t.call.apply(t,[this].concat(i))),"connectedSortables",[]),a(c(e),"currentConnectedSortable",null),a(c(e),"connectedDraggable",null),a(c(e),"items",[]),a(c(e),"currentItem",null),a(c(e),"currentItemStyle",{}),a(c(e),"currentItemRefs",null),a(c(e),"elementProportions",null),a(c(e),"placeholder",null),a(c(e),"isOver",!1),a(c(e),"isDraggableOver",!1),a(c(e),"floating",!1),a(c(e),"previousPosition",null),a(c(e),"resetCurrentItem",!1),a(c(e),"rearrangeIteration",0),a(c(e),"setup",(function(){e.addPlugin(new qo(c(e))),e.addPlugin(new ai(c(e))),e.addPlugin(new si(c(e))),e.addPlugin(new ua(c(e),"cursor")),e.addPlugin(new ua(c(e),"opacity")),e.addPlugin(new ua(c(e),"zIndex")),e.addPlugin(new Vo(c(e))),e.addSensor(new pa(c(e))),document.addEventListener("mouse:start",e.onDragStart),document.addEventListener("mouse:move",e.onDragMove),document.addEventListener("mouse:stop",e.onDragStop),e.element[e.dataProperty]=c(e),w(e.element,e.elementClass),e.refresh(),e.offset.element=V(e.element),e.trigger(new $o({sortable:c(e)}));})),a(c(e),"onDragStart",(function(t){var n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],r=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=t.detail;if(o.caller===c(e)||r)if(e.disabled||e.reverting)o.cancel();else if(e.refreshItems(),e.currentItem=e.findItem(o),e.currentItem)if(e.currentItemRefs={previous:e.currentItem.previousElementSibling,parent:e.currentItem.parentNode},e.refreshPositions(),e.isInsideHandle(o))if(e.helper=e.createHelper(o),e.helper){e.createPlaceholder(),w(e.helper,e.helperClass),e.cacheMargins(),e.currentConnectedSortable=c(e),e.dragging=!0,e.cacheHelperSize(),e.helperAttrs={scrollParent:Z(e.helper,!1)},e.startEvent=o,e.calculateOffsets(o),e.calculatePosition(o,!1),e.items=e.items.filter((function(t){return t.element!==e.currentItem})),Fo(e.helper),e.helperAttrs.cssPosition="absolute",e.helper!==e.currentItem&&xo(e.currentItem);var i=new _u({source:e.currentItem,sensorEvent:o,originalEvent:o.originalEvent});if(e.trigger(i),i.canceled)return o.cancel(),void e.clear();e.cacheHelperSize(),n||e.connectedSortables.forEach((function(t){t.trigger(new Go({sortable:t,sensorEvent:o,peerSortable:c(e)}));})),Wo.prepareOffsets(c(e),o),e.onDragMove(t,!0,r),e.scrollListeners=Do(e.element,"body").map((function(n){return C(n,"scroll",(function(){return Wo.prepareOffsets(c(e),t)}))}));}else o.cancel();else o.cancel();else o.cancel();})),a(c(e),"onDragMove",(function(t){var n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],r=arguments.length>2&&void 0!==arguments[2]&&arguments[2],o=t.detail;if(o.caller===c(e)&&e.dragging||r){if(e.calculatePosition(o),e.previousPosition||(e.previousPosition=e.position.absolute),!n){var i=new Fu({source:e.currentItem,helper:e.helper,placeholder:e.placeholder,sensorEvent:o,originalEvent:o.originalEvent,position:e.position.current});if(e.trigger(i),i.canceled)return void e.onDragCancel(To(e.helper))}D(e.helper,{left:e.position.current.left+"px",top:e.position.current.top+"px"});var a=null;e.items.forEach((function(t){if(!a&&t.instance===e.currentConnectedSortable){var n=e.getPointerIntersection(t);if(n){var r=e.options.tolerance,o=t.element;if(o!==e.currentItem&&o!==e.placeholder[1===n?"nextElementSibling":"previousElementSibling"]&&!Co(e.placeholder,o)){var i=1===n?"down":"up";("pointer"===r||e.intersectsWithSides(t))&&(e.rearrange(null,t,i),e.trigger(new Zo({sortable:c(e)})),a=t);}}}})),e.contactSortables(o),Wo.onDragMove(c(e),o),e.previousPosition=e.position.absolute;}})),a(c(e),"onDragCancel",(function(t){var n=t.detail;e.scrollListeners.forEach((function(e){return e()})),e.scrollListeners=[],Wo.onDragStop(c(e),n),e.sensors.forEach((function(e){return e.cancel(t)}));})),a(c(e),"onDragStop",(function(t){var n=arguments.length>1&&void 0!==arguments[1]&&arguments[1],r=t.detail;if(r.caller===c(e)&&e.dragging||n){var o=e.options,i=o.revert,a=o.revertDuration,s=e.position.original,l=new Xu({source:e.currentItem,helper:e.helper,droppable:Wo.drop(c(e),r),sensorEvent:r,originalEvent:r.originalEvent});"invalid"===i&&!l.droppable||"valid"===i&&l.droppable||ml(i)&&i(e.currentItem,l.droppable)||i?(e.reverting=!0,gs({targets:[e.helper],left:s.left+"px",top:s.top+"px",duration:a,easing:"linear",complete:function(){e.reverting=!1,e.trigger(l),l.canceled||e.clear();}})):(e.trigger(l),l.canceled||e.clear());}})),e}return i(n,[{key:"cancel",value:function(){this.resetCurrentItem=!0,h(l(n.prototype),"cancel",this).call(this);}},{key:"destroy",value:function(){var e=this;this.dragging?this.pendingDestroy=!0:(this.plugins.forEach((function(e){return e.detach()})),this.sensors.forEach((function(e){return e.detach()})),document.removeEventListener("mouse:start",this.onDragStart),document.removeEventListener("mouse:move",this.onDragMove),document.removeEventListener("mouse:stop",this.onDragStop),delete this.element[this.dataProperty],K(this.element,this.elementClass),this.items.forEach((function(t){return delete t.element[e.dataProperty]})),this.findHandles().forEach((function(t){K(t,e.handleClass);})),this.trigger(new ri({sortable:this})));}},{key:"dataProperty",get:function(){return oi}},{key:"elementClass",get:function(){return "ui-sortable"}},{key:"handleClass",get:function(){return "ui-sortable-handle"}},{key:"helperClass",get:function(){return "ui-sortable-helper"}},{key:"placeholderClass",get:function(){return "ui-sortable-placeholder"}},{key:"over",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;this.isOver||(this.trigger(new Ko({sortable:this,peerSortable:e,draggable:t})),this.isOver=!0);}},{key:"out",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;this.isOver&&(this.trigger(new ti({sortable:this,peerSortable:e,draggable:t})),this.isOver=!1);}},{key:"refresh",value:function(){var e=this;this.refreshItems(),this.refreshPositions(),this.findHandles().forEach((function(t){w(t,e.handleClass);}));}},{key:"refreshItems",value:function(){var e=this,t=this.options.connectWith;this.connectedSortables=[this],this.items=this.findItems(),(t?F(document,t):[]).forEach((function(t){var n=t[e.dataProperty];n&&n!==e&&!n.disabled&&(e.items=e.items.concat(n.findItems(null,e.currentItem)),e.connectedSortables.push(n));}));}},{key:"refreshPositions",value:function(){var e=this,t=this.options.axis;this.floating=!!this.items.length&&("x"===t||Ro(this.items[0].element)),this.helper&&this.helperAttrs&&this.helperAttrs.offsetParent&&(this.offset.parent=this.getParentOffset()),this.items.forEach((function(t){if(!e.currentConnectedSortable||e.currentConnectedSortable===e||t.element===e.currentItem){var n=V(t.element),r=n.width,o=n.height,i=n.left,a=n.top;t.width=r,t.height=o,t.left=i,t.top=a;}})),this.connectedSortables.forEach((function(e){return e.cacheElementProportions()}));}},{key:"findItem",value:function(e){var t=this,n=Do(e.target).find((function(e){return e!==t.element&&e[t.dataProperty]===t}));return n||e.target===this.element||e.target[this.dataProperty]!==this||(n=e.target),n}},{key:"findItems",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,r=[],o=this.options.items,i=function(t){return t[e.dataProperty]=e,{element:t,instance:e,width:0,height:0,left:0,top:0}};if(ml(o)){if(r=o({options:this.options,item:n||this.currentItem}),!Array.isArray(r))return []}else r=o?F(this.element,o):Lo(this.element.childNodes).filter((function(e){return 1===e.nodeType}));return ml(t)?r.filter(t).map(i):r.map(i)}},{key:"findClosestItem",value:function(e,t){var n=this,r=null,o=1e4,i=t.floating||Ro(this.currentItem),a=!1,s=null,l=i?"pageX":"pageY";return this.items.forEach((function(u){Co(t.element,u.element)&&u.element!==n.currentItem&&(a=!1,s=V(u.element)[i?"left":"top"],e[l]-s>u[i?"width":"height"]/2&&(a=!0),Math.abs(e[l]-s)<o&&(o=Math.abs(e[l]-s),r=u));})),{item:r,nearBottom:a}}},{key:"findHandles",value:function(){var e=[],t=this.options.handle;return this.items.forEach((function(n){t?e=e.concat(F(n.element,t)):e.push(n.element);})),e}},{key:"createHelper",value:function(e){var t=null,n=this.options,r=n.appendTo,o=n.helper,i=n.forceHelperSize;if(ml(o)?t=o.apply(this.element,[e,this.currentItem]):"clone"===o?((t=this.currentItem.cloneNode(!0)).removeAttribute("id"),t.removeAttribute(this.dataProperty),t[this.dataProperty]=this):t=this.currentItem,t instanceof HTMLElement){if(!H(t,"body")){var a="parent"===r?this.currentItem.parentNode:document.querySelector(r);if(!(a instanceof HTMLElement))return null;a.appendChild(t);}return t===this.currentItem&&(this.currentItemStyle={width:Q(this.currentItem),height:q(this.currentItem),position:D(this.currentItem,"position"),left:D(this.currentItem,"left"),top:D(this.currentItem,"top")}),t.style.width&&!i||Q(t,Q(this.currentItem)),t.style.height&&!i||q(t,q(this.currentItem)),t}return null}},{key:"createPlaceholder",value:function(){if(this.placeholder)this.updatePlaceholder(this,this.placeholder);else {var e=this.currentItem.nodeName.toLowerCase(),t=document.createElement(e);if(t.className=this.currentItem.className,w(t,this.placeholderClass),K(t,this.helperClass),"thead"===e||"tbody"===e){var n=document.createElement("tr");t.appendChild(n),this.createTableRowPlaceholder(this.currentItem.querySelector("tr"),n,"thead"===e?"th":"tr");}else "tr"===e?this.createTableRowPlaceholder(this.currentItem,t,"tr"):"img"===e&&t.setAttribute("src",this.currentItem.getAttribute("src"));this.placeholder=jo(t,this.currentItem),this.updatePlaceholder(this,t);}}},{key:"createTableRowPlaceholder",value:function(e,t,n){F(e,n).forEach((function(e){var r=document.createElement(n);r.innerHTML="&#160;",r.setAttribute("colspan",e.getAttribute("colspan")),t.appendChild(r);}));}},{key:"updatePlaceholder",value:function(e,t){var n=e.options.forcePlaceholderSize;t&&n&&(Q(t)||Q(t,Q(this.currentItem)+Xo(this.currentItem,"paddingLeft")+Xo(this.currentItem,"paddingRight")),q(t)||q(t,q(this.currentItem)+Xo(this.currentItem,"paddingTop")+Xo(this.currentItem,"paddingBottom")));}},{key:"cacheMargins",value:function(){this.margins={left:parseInt(D(this.currentItem,"marginLeft"),10)||0,top:parseInt(D(this.currentItem,"marginTop"),10)||0,right:parseInt(D(this.currentItem,"marginRight"),10)||0,bottom:parseInt(D(this.currentItem,"marginBottom"),10)||0};}},{key:"cacheElementProportions",value:function(){this.elementProportions=V(this.element);}},{key:"calculateOffsets",value:function(e){var t=V(this.currentItem);this.offset.click={left:e.pageX-t.left-this.margins.left,top:e.pageY-t.top-this.margins.top},this.offset.parent=this.getParentOffset(),this.offset.relative=this.getRelativeOffset();}},{key:"getParentOffset",value:function(){return this.helperAttrs.offsetParent=U(this.helper),h(l(n.prototype),"getParentOffset",this).call(this)}},{key:"calculatePosition",value:function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],n=t?this.constraintPosition(e):e,r=n.pageX,o=n.pageY,i=this.helperAttrs.scrollParent,a=this.helperAttrs,s=a.cssPosition,l=a.offsetParent,u=zo(i);"absolute"!==s||i!==document&&Co(i,l)||(u=zo(i=l)),"relative"===s&&i===document&&i!==l&&(this.offset.relative=this.getRelativeOffset()),this.offset.scroll={left:B(i),top:W(i)};var c=this.offset,f=c.click,p=c.parent,h=c.relative,d=c.scroll,g={left:r-f.left-p.left-h.left+("fixed"===s?-d.left:u?0:d.left),top:o-f.top-p.top-h.top+("fixed"===s?-d.top:u?0:d.top)};this.position.original||(this.position.original=g),this.position.current=g,this.position.absolute=this.convertPosition(g,"absolute");}},{key:"convertPosition",value:function(e,t){var n=this.helperAttrs.scrollParent,r=this.helperAttrs,o=r.cssPosition,i=r.offsetParent,a=this.offset,s=a.parent,l=a.relative,u="absolute"===t?1:-1,c=zo(n);return "absolute"!==o||n!==document&&Co(n,i)||(c=zo(n=i)),{left:e.left+s.left*u+l.left*u-("fixed"===o?-B(n):(c?0:B(n))*u),top:e.top+s.top*u+l.top*u-("fixed"===o?-W(n):(c?0:W(n))*u)}}},{key:"getDragDirection",value:function(e){var t=this.position.absolute["x"===e?"left":"top"]-this.previousPosition["x"===e?"left":"top"];return 0!==t?t>0?"x"===e?"right":"down":"x"===e?"left":"up":null}},{key:"getPointerIntersection",value:function(e){var t=this.options.axis,n=this.offset.click,r=this.position.absolute,o=r.left+n.left,i=r.top+n.top;if(!("y"===t||o>=e.left&&o<e.left+e.width)||!("x"===t||i>=e.top&&i<e.top+e.height))return 0;var a=this.getDragDirection("x"),s=this.getDragDirection("y");return this.floating?"right"===a||"bottom"===s?2:1:"down"===s?2:1}},{key:"intersectsWith",value:function(e){var t=this.options,n=t.axis,r=t.tolerance,o=this.helperSize,i=o.width,a=o.height,s=this.offset.click,l=this.position.absolute,u=l.left+s.left,c=l.top+s.top;return l.left,s.left,l.top,s.top,"pointer"===r||this.floating&&i>e.width||!this.floating&&a>e.height?("y"===n||u>e.left&&u<e.left+e.width)&&("x"===n||c>e.top&&c<e.top+e.height):e.left<l.left+i/2&&e.left+e.width>l.left+i/2&&e.top<l.top+a/2&&e.top+e.height>l.top+a/2}},{key:"intersectsWithSides",value:function(e){var t=e.width,n=e.height,r=e.left,o=e.top,i=this.offset.click,a=this.position.absolute,s=a.left+i.left,l=a.top+i.top,u=r+t/2,c=o+n/2,f=this.getDragDirection("x"),p=this.getDragDirection("y");return this.floating&&f?"right"===f&&s>=u&&s<u+t||"left"===f&&!(s>=u&&s<u+t):"down"===p&&l>=c&&l<c+n||"up"===p&&!(l>=c&&l<c+n)}},{key:"contactSortables",value:function(e){var t=this,n=null,r=null,o=new Zo({sortable:this});this.connectedSortables.forEach((function(e){Co(t.currentItem,e.element)||(t.intersectsWith(e.elementProportions)?n&&Co(e.element,n.element)||(n=e):e.out(t));})),n&&(1===this.connectedSortables.length?n.over(null):((r=this.findClosestItem(e,n)).item||this.options.dropOnEmpty)&&(this.currentConnectedSortable===n?n.over(this):(r.item?this.rearrange(null,r.item,r.nearBottom?"up":"down"):this.rearrange(n.element),this.trigger(o),n.over(this),n.trigger(o),this.currentConnectedSortable=n,this.updatePlaceholder(n,this.placeholder))));}},{key:"rearrange",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;if(t instanceof HTMLElement)t.appendChild(this.placeholder);else {if(!(n&&n.element instanceof HTMLElement))return;n.element.parentNode.insertBefore(this.placeholder,"down"===r?n.element:n.element.nextSibling);}this.rearrangeIteration=this.rearrangeIteration?this.rearrangeIteration++:1;var o=this.rearrangeIteration;setTimeout((function(){o===e.rearrangeIteration&&e.refreshPositions();}));}},{key:"clear",value:function(){var e,t=this;if(this.helper&&this.currentItem&&(Mo(this.currentItem,this.placeholder),this.helper===this.currentItem?(Cl(this.currentItemStyle,(function(e,n){"auto"!==e&&"static"!==e||(t.currentItemStyle[n]="");})),D(this.currentItem,this.currentItemStyle)):(e=this.currentItem)&&D(e,{display:e.previousDisplay||""}),this.resetCurrentItem)){var n=this.currentItemRefs,r=n.previous,o=n.parent;r?jo(this.currentItem,r):Mo(this.currentItem,o.firstElementChild),this.resetCurrentItem=!1;}this.connectedDraggable&&this.trigger(new Jo({sortable:this,item:this.connectedDraggable.element,draggable:this.connectedDraggable})),(this.connectedDraggable||this.currentItemRefs.previous!==function(e,t,n){for(var r=null,o=e,i="previousElementSibling";o&&o[i];){if(!n||!N(o[i],n)){r=o[i];break}o=o[i];}return r}(this.currentItem,0,".".concat(this.helperClass))||this.currentItemRefs.parent!==this.currentItem.parentNode)&&this.trigger(new ei({sortable:this})),this.currentConnectedSortable!==this&&(this.trigger(new Qo({sortable:this,item:this.currentItem,peerSortable:this.currentConnectedSortable})),this.currentConnectedSortable.trigger(new Jo({sortable:this.currentConnectedSortable,item:this.currentItem,peerSortable:this})),this.currentConnectedSortable.trigger(new ei({sortable:this.currentConnectedSortable}))),this.connectedSortables.forEach((function(e){e.out(t),e.trigger(new ni({sortable:e,peerSortable:t}));})),this.placeholder&&(this.placeholder.parentNode&&this.placeholder.parentNode.removeChild(this.placeholder),this.placeholder=null),this.helper&&(K(this.helper,this.helperClass),this.helper===this.currentItem||this.cancelHelperRemoval||this.helper.parentNode.removeChild(this.helper),this.cancelHelperRemoval=!1,this.helper=null),this.connectedDraggable=null,this.currentItem=null,this.currentItemRefs=null,this.dragging=!1,this.pendingDestroy&&(this.destroy(),this.pendingDestroy=!1);}}]),n}(Lu);a(Yu,"defaultOptions",{appendTo:"parent",axis:null,connectWith:null,containment:null,cursor:null,disabled:!1,distance:0,dropOnEmpty:!0,forceHelperSize:!1,forcePlaceholderSize:!1,grid:null,handle:null,helper:"original",items:null,opacity:null,revert:!1,revertDuration:200,scope:"default",scroll:!0,scrollSensitivity:20,scrollSpeed:10,skip:"input, textarea, button, select, option",tolerance:"intersect",zIndex:null});var zu={Plugin:y,Sensor:ca,Draggable:Lu,Droppable:Hu,DragDropManager:Wo,Sortable:Yu};e.DragDropManager=Wo,e.Draggable=Lu,e.Droppable=Hu,e.Plugin=y,e.Sensor=ca,e.Sortable=Yu,e.default=zu,Object.defineProperty(e,"__esModule",{value:!0});}));

    });

    var agnosticDraggable$1 = /*@__PURE__*/getDefaultExportFromCjs(agnosticDraggable);

    /**** use:sortable={options} ****/
    var SortableEventHandlers = {
        'sortable:init': InjectorForEvent('sortable:init'),
        'sortable:activate': InjectorForEvent('sortable:activate'),
        'sort:start': InjectorForEvent('sort:start'),
        'sort:move': InjectorForEvent('sort:move'),
        'sort:stop': InjectorForEvent('sort:stop'),
        'sortable:over': InjectorForEvent('sortable:over'),
        'sortable:change': InjectorForEvent('sortable:change'),
        'sortable:remove': InjectorForEvent('sortable:remove'),
        'sortable:receive': InjectorForEvent('sortable:receive'),
        'sortable:update': InjectorForEvent('sortable:update'),
        'sortable:out': InjectorForEvent('sortable:out'),
        'sortable:deactivate': InjectorForEvent('sortable:deactivate'),
        'sortable:destroy': InjectorForEvent('sortable:destroy')
    };
    function sortable(sortableElement, Options) {
        new agnosticDraggable$1.Sortable(sortableElement, Options, SortableEventHandlers);
    } // currently, there is no possibility to update "Options"
    /**** InjectorForEvent ****/
    function InjectorForEvent(Topic) {
        return function (originalEvent) {
            // @ts-ignore
            var EventData = originalEvent.data;
            [
                EventData.source,
                EventData.draggable && EventData.draggable.element,
                EventData.droppable && EventData.droppable.element,
                EventData.sortable && EventData.sortable.element
            ].forEach(function (Origin) {
                if (Origin != null) {
                    Origin.dispatchEvent(new CustomEvent(Topic, { detail: EventData }));
                }
            });
        };
    }

    //----------------------------------------------------------------------------//
    //                           Svelte Touch-to-Mouse                            //
    //----------------------------------------------------------------------------//
    // see https://stackoverflow.com/questions/1517924/javascript-mapping-touch-events-to-mouse-events
    // and https://stackoverflow.com/questions/5885808/includes-touch-events-clientx-y-scrolling-or-not
    // Important!
    // for all elements affected by "mapTouchToMouseFor" (i.e., for all elements
    // selected by "Selector"), don't forget to set the following style properties
    //
    // -webkit-touch-callout:none;
    // -ms-touch-action: none; touch-action: none;
    //
    // either in a stylesheet or inline
    function mapTouchToMouseFor(Selector) {
        function TouchEventMapper(originalEvent) {
            var Target = originalEvent.target;
            if (!Target.matches(Selector)) {
                return;
            }
            var simulatedEventType;
            switch (originalEvent.type) {
                case 'touchstart':
                    simulatedEventType = 'mousedown';
                    break;
                case 'touchmove':
                    simulatedEventType = 'mousemove';
                    break;
                case 'touchend':
                    simulatedEventType = 'mouseup';
                    break;
                case 'touchcancel':
                    simulatedEventType = 'mouseup';
                    break;
                default: return;
            }
            var firstTouch = originalEvent.changedTouches[0];
            var clientX = firstTouch.clientX, pageX = firstTouch.pageX, PageXOffset = window.pageXOffset;
            var clientY = firstTouch.clientY, pageY = firstTouch.pageY, PageYOffset = window.pageYOffset;
            if ((pageX === 0) && (Math.floor(clientX) > Math.floor(pageX)) ||
                (pageY === 0) && (Math.floor(clientY) > Math.floor(pageY))) {
                clientX -= PageXOffset;
                clientY -= PageYOffset;
            }
            else if ((clientX < pageX - PageXOffset) || (clientY < pageY - PageYOffset)) {
                clientX = pageX - PageXOffset;
                clientY = pageY - PageYOffset;
            }
            var simulatedEvent = new MouseEvent(simulatedEventType, {
                bubbles: true, cancelable: true,
                screenX: firstTouch.screenX, screenY: firstTouch.screenY,
                // @ts-ignore we definitely want "pageX" and "pageY"
                clientX: clientX, clientY: clientY, pageX: pageX, pageY: pageY, buttons: 1, button: 0,
                ctrlKey: originalEvent.ctrlKey, shiftKey: originalEvent.shiftKey,
                altKey: originalEvent.altKey, metaKey: originalEvent.metaKey
            });
            firstTouch.target.dispatchEvent(simulatedEvent);
            //    originalEvent.preventDefault()
        }
        document.addEventListener('touchstart', TouchEventMapper, true);
        document.addEventListener('touchmove', TouchEventMapper, true);
        document.addEventListener('touchend', TouchEventMapper, true);
        document.addEventListener('touchcancel', TouchEventMapper, true);
    }

    /* client\pages\Vote.svelte generated by Svelte v3.44.0 */

    const file$3 = "client\\pages\\Vote.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (85:8) {#if winner}
    function create_if_block_1(ctx) {
    	let div2;
    	let header;
    	let p0;
    	let t1;
    	let div1;
    	let div0;
    	let p1;
    	let t2_value = /*winner*/ ctx[0].title + "";
    	let t2;
    	let t3;
    	let p2;
    	let t4_value = /*winner*/ ctx[0].body + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			header = element("header");
    			p0 = element("p");
    			p0.textContent = "The winner of the election";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p2 = element("p");
    			t4 = text(t4_value);
    			attr_dev(p0, "class", "card-header-title");
    			add_location(p0, file$3, 87, 20, 3084);
    			attr_dev(header, "class", "card-header");
    			add_location(header, file$3, 86, 16, 3034);
    			attr_dev(p1, "class", "title");
    			add_location(p1, file$3, 91, 24, 3283);
    			attr_dev(p2, "class", "subtitle");
    			add_location(p2, file$3, 95, 24, 3402);
    			attr_dev(div0, "class", "content svelte-1r6fbeb");
    			add_location(div0, file$3, 90, 20, 3236);
    			attr_dev(div1, "class", "card-content svelte-1r6fbeb");
    			add_location(div1, file$3, 89, 16, 3188);
    			attr_dev(div2, "class", "card svelte-1r6fbeb");
    			add_location(div2, file$3, 85, 12, 2998);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, header);
    			append_dev(header, p0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(p2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winner*/ 1 && t2_value !== (t2_value = /*winner*/ ctx[0].title + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*winner*/ 1 && t4_value !== (t4_value = /*winner*/ ctx[0].body + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(85:8) {#if winner}",
    		ctx
    	});

    	return block;
    }

    // (107:16) {#if listItems}
    function create_if_block(ctx) {
    	let div;
    	let t0;
    	let p;
    	let t2;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*listItems*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*remainingListItems*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			p = element("p");
    			p.textContent = "I do not want to vote for:";
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "id", "not-included-on-ballot");
    			attr_dev(p, "class", "help is-danger");
    			add_location(p, file$3, 131, 24, 5091);
    			attr_dev(div, "class", "sortable > div svelte-1r6fbeb");
    			set_style(div, "display", "block");
    			set_style(div, "position", "relative");
    			set_style(div, "width", "200px");
    			set_style(div, "margin", "20px");
    			add_location(div, file$3, 107, 20, 3775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(div, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			/*div_binding*/ ctx[6](div);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(sortable.call(null, div, {
    						cursor: "grabbing",
    						handle: ".listItemHandle",
    						tolerance: "intersect",
    						zIndex: 10
    					})),
    					listen_dev(div, "sortable:activate", onSortableActivate, false, false, false),
    					listen_dev(div, "sortable:deactivate", onSortableDeactivate, false, false, false),
    					listen_dev(div, "sortable:update", /*onSortableUpdate*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*listItems*/ 4) {
    				each_value_1 = /*listItems*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div, t0);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*remainingListItems*/ 8) {
    				each_value = /*remainingListItems*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(107:16) {#if listItems}",
    		ctx
    	});

    	return block;
    }

    // (122:24) {#each listItems as listItem}
    function create_each_block_1(ctx) {
    	let div1;
    	let t0_value = /*listItem*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div1_data_list_key_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			attr_dev(div0, "class", "listItemHandle svelte-1r6fbeb");
    			add_location(div0, file$3, 127, 32, 4910);
    			attr_dev(div1, "data-list-key", div1_data_list_key_value = /*listItem*/ ctx[9]);
    			set_style(div1, "display", "inline-block");
    			set_style(div1, "position", "relative");
    			set_style(div1, "width", "198px");
    			set_style(div1, "border", "solid 1px black");
    			set_style(div1, "margin", "1px");
    			set_style(div1, "padding", "5px");
    			set_style(div1, "background-color", "hsl(200deg,50%,90%)");
    			set_style(div1, "line-height", "20px");
    			attr_dev(div1, "class", "svelte-1r6fbeb");
    			add_location(div1, file$3, 122, 28, 4542);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*listItems*/ 4 && t0_value !== (t0_value = /*listItem*/ ctx[9] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*listItems*/ 4 && div1_data_list_key_value !== (div1_data_list_key_value = /*listItem*/ ctx[9])) {
    				attr_dev(div1, "data-list-key", div1_data_list_key_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(122:24) {#each listItems as listItem}",
    		ctx
    	});

    	return block;
    }

    // (135:24) {#each remainingListItems as listItem}
    function create_each_block(ctx) {
    	let div1;
    	let t0_value = /*listItem*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div1_data_list_key_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			attr_dev(div0, "class", "listItemHandle svelte-1r6fbeb");
    			add_location(div0, file$3, 140, 32, 5693);
    			attr_dev(div1, "data-list-key", div1_data_list_key_value = /*listItem*/ ctx[9]);
    			set_style(div1, "display", "inline-block");
    			set_style(div1, "position", "relative");
    			set_style(div1, "width", "198px");
    			set_style(div1, "border", "solid 1px black");
    			set_style(div1, "margin", "1px");
    			set_style(div1, "padding", "5px");
    			set_style(div1, "background-color", "hsl(200deg,50%,90%)");
    			set_style(div1, "line-height", "20px");
    			attr_dev(div1, "class", "svelte-1r6fbeb");
    			add_location(div1, file$3, 135, 28, 5325);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*remainingListItems*/ 8 && t0_value !== (t0_value = /*listItem*/ ctx[9] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*remainingListItems*/ 8 && div1_data_list_key_value !== (div1_data_list_key_value = /*listItem*/ ctx[9])) {
    				attr_dev(div1, "data-list-key", div1_data_list_key_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(135:24) {#each remainingListItems as listItem}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let div2;
    	let t0;
    	let br;
    	let t1;
    	let div1;
    	let div0;
    	let p;
    	let t3;
    	let if_block0 = /*winner*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*listItems*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "I'm voting for:";
    			t3 = space();
    			if (if_block1) if_block1.c();
    			add_location(br, file$3, 102, 8, 3592);
    			attr_dev(p, "class", "subtitle");
    			add_location(p, file$3, 105, 16, 3681);
    			attr_dev(div0, "class", "column svelte-1r6fbeb");
    			add_location(div0, file$3, 104, 12, 3643);
    			attr_dev(div1, "class", "columns svelte-1r6fbeb");
    			add_location(div1, file$3, 103, 8, 3608);
    			attr_dev(div2, "class", "container svelte-1r6fbeb");
    			add_location(div2, file$3, 83, 4, 2939);
    			attr_dev(section, "class", "section");
    			add_location(section, file$3, 82, 0, 2908);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, br);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			if (if_block1) if_block1.m(div0, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*winner*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div2, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*listItems*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function onSortableActivate() {
    	disableBodyScroll(document.body);
    }

    function onSortableDeactivate() {
    	enableBodyScroll(document.body);
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Vote', slots, []);
    	mapTouchToMouseFor(".listItemHandle");
    	let ballot;
    	let winner;
    	let listView;
    	let listItems;
    	let remainingListItems;
    	let { params = {} } = $$props;

    	onMount(async () => {
    		const listItemsResponse = await fetch(`http://127.0.0.1:8000/api/ballot?token=${params.token}`, { credentials: "omit" });
    		ballot = await listItemsResponse.json();
    		$$invalidate(2, listItems = ballot.selected_items.map(x => x.title));
    		$$invalidate(3, remainingListItems = ballot.remaining_items.map(x => x.title));
    		const getResultsResponse = await fetch("http://127.0.0.1:8000/api/results");
    		$$invalidate(0, winner = await getResultsResponse.json());
    	});

    	async function onSortableUpdate() {
    		let votes = [];
    		const itemViewList = listView.children;

    		for (let i = 0, l = itemViewList.length; i < l; i++) {
    			const htmlElement = itemViewList[i];

    			if (htmlElement.id === "not-included-on-ballot") {
    				break;
    			}

    			const listKey = htmlElement.dataset.listKey;

    			if (listKey) {
    				const item = ballot.selected_items.concat(ballot.remaining_items).find(x => x.title === listKey);
    				votes.push(item.id);
    			}
    		}

    		await sendBallot(votes);
    		const getResultsResponse = await fetch("http://127.0.0.1:8000/api/results");
    		$$invalidate(0, winner = await getResultsResponse.json());
    	}

    	async function sendBallot(votes) {
    		await fetch(`http://127.0.0.1:8000/api/vote/?token=${params.token}`, {
    			method: "POST",
    			cache: "no-cache",
    			headers: { "Content-Type": "application/json" },
    			credentials: "omit",
    			body: JSON.stringify(votes)
    		});
    	}

    	const writable_props = ['params'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Vote> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			listView = $$value;
    			$$invalidate(1, listView);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('params' in $$props) $$invalidate(5, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		enableBodyScroll,
    		disableBodyScroll,
    		sortable,
    		onMount,
    		mapTouchToMouseFor,
    		ballot,
    		winner,
    		listView,
    		listItems,
    		remainingListItems,
    		params,
    		onSortableActivate,
    		onSortableDeactivate,
    		onSortableUpdate,
    		sendBallot
    	});

    	$$self.$inject_state = $$props => {
    		if ('ballot' in $$props) ballot = $$props.ballot;
    		if ('winner' in $$props) $$invalidate(0, winner = $$props.winner);
    		if ('listView' in $$props) $$invalidate(1, listView = $$props.listView);
    		if ('listItems' in $$props) $$invalidate(2, listItems = $$props.listItems);
    		if ('remainingListItems' in $$props) $$invalidate(3, remainingListItems = $$props.remainingListItems);
    		if ('params' in $$props) $$invalidate(5, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		winner,
    		listView,
    		listItems,
    		remainingListItems,
    		onSortableUpdate,
    		params,
    		div_binding
    	];
    }

    class Vote extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { params: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Vote",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get params() {
    		throw new Error("<Vote>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Vote>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* client\pages\NotFound.svelte generated by Svelte v3.44.0 */

    const file$2 = "client\\pages\\NotFound.svelte";

    function create_fragment$4(ctx) {
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NotFound";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Oops, this route doesn't exist!";
    			add_location(h2, file$2, 0, 0, 0);
    			add_location(p, file$2, 2, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotFound', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* client\pages\Unauthorized.svelte generated by Svelte v3.44.0 */

    const file$1 = "client\\pages\\Unauthorized.svelte";

    function create_fragment$3(ctx) {
    	let h2;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Unauthorized";
    			t1 = space();
    			p = element("p");
    			p.textContent = "You don't have access to this resource!";
    			add_location(h2, file$1, 0, 0, 0);
    			add_location(p, file$1, 2, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Unauthorized', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Unauthorized> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Unauthorized extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Unauthorized",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const routes = {
        "/": Index,
        "/about": About,
        "/vote/:token": Vote,
        "/unauthorized": Unauthorized,
        // Catch-all, must be last
        "*": NotFound
    };

    /* client\components\Navbar.svelte generated by Svelte v3.44.0 */
    const file = "client\\components\\Navbar.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let a1;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let span2;
    	let t3;
    	let div2;
    	let div1;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let router;
    	let current;
    	router = new Router({ props: { routes }, $$inline: true });
    	router.$on("conditionsFailed", /*onConditionsFailed*/ ctx[0]);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			a1 = element("a");
    			span0 = element("span");
    			t1 = space();
    			span1 = element("span");
    			t2 = space();
    			span2 = element("span");
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			a2 = element("a");
    			a2.textContent = "Home";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "About";
    			t7 = space();
    			create_component(router.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "/icons/favicon-512x512.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Ranked Voting Icon");
    			add_location(img, file, 12, 12, 419);
    			attr_dev(a0, "class", "navbar-item");
    			attr_dev(a0, "href", "/#/");
    			add_location(a0, file, 11, 8, 371);
    			attr_dev(span0, "aria-hidden", "true");
    			add_location(span0, file, 23, 12, 723);
    			attr_dev(span1, "aria-hidden", "true");
    			add_location(span1, file, 24, 12, 764);
    			attr_dev(span2, "aria-hidden", "true");
    			add_location(span2, file, 25, 12, 805);
    			attr_dev(a1, "href", "/#");
    			attr_dev(a1, "role", "button");
    			attr_dev(a1, "class", "navbar-burger");
    			attr_dev(a1, "data-target", "navMenu");
    			attr_dev(a1, "aria-label", "menu");
    			attr_dev(a1, "aria-expanded", "false");
    			add_location(a1, file, 15, 8, 510);
    			attr_dev(div0, "class", "navbar-brand");
    			add_location(div0, file, 10, 4, 335);
    			attr_dev(a2, "class", "navbar-item");
    			attr_dev(a2, "href", "#/");
    			add_location(a2, file, 32, 12, 993);
    			attr_dev(a3, "class", "navbar-item");
    			attr_dev(a3, "href", "#/about");
    			add_location(a3, file, 34, 12, 1052);
    			attr_dev(div1, "class", "navbar-start");
    			add_location(div1, file, 31, 8, 953);
    			attr_dev(div2, "class", "navbar-menu");
    			attr_dev(div2, "id", "navMenu");
    			add_location(div2, file, 30, 4, 905);
    			attr_dev(nav, "class", "navbar");
    			attr_dev(nav, "role", "navigation");
    			attr_dev(nav, "aria-label", "main navigation");
    			add_location(nav, file, 8, 0, 217);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(div0, t0);
    			append_dev(div0, a1);
    			append_dev(a1, span0);
    			append_dev(a1, t1);
    			append_dev(a1, span1);
    			append_dev(a1, t2);
    			append_dev(a1, span2);
    			append_dev(nav, t3);
    			append_dev(nav, div2);
    			append_dev(div2, div1);
    			append_dev(div1, a2);
    			append_dev(div1, t5);
    			append_dev(div1, a3);
    			insert_dev(target, t7, anchor);
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t7);
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);

    	function onConditionsFailed(event) {
    		push("/unauthorized");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes, push, onConditionsFailed });
    	return [onConditionsFailed];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* client\components\Footer.svelte generated by Svelte v3.44.0 */

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* client\App.svelte generated by Svelte v3.44.0 */

    function create_fragment(ctx) {
    	let navbar;
    	let t;
    	let footer;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
