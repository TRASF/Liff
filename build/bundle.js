
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$1() { }
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
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
            update: noop$1,
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
            this.$destroy = noop$1;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var global$1 =
      (typeof globalThis !== 'undefined' && globalThis) ||
      (typeof self !== 'undefined' && self) ||
      (typeof global$1 !== 'undefined' && global$1);

    var support = {
      searchParams: 'URLSearchParams' in global$1,
      iterable: 'Symbol' in global$1 && 'iterator' in Symbol,
      blob:
        'FileReader' in global$1 &&
        'Blob' in global$1 &&
        (function() {
          try {
            new Blob();
            return true
          } catch (e) {
            return false
          }
        })(),
      formData: 'FormData' in global$1,
      arrayBuffer: 'ArrayBuffer' in global$1
    };

    function isDataView(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    if (support.arrayBuffer) {
      var viewClasses = [
        '[object Int8Array]',
        '[object Uint8Array]',
        '[object Uint8ClampedArray]',
        '[object Int16Array]',
        '[object Uint16Array]',
        '[object Int32Array]',
        '[object Uint32Array]',
        '[object Float32Array]',
        '[object Float64Array]'
      ];

      var isArrayBufferView =
        ArrayBuffer.isView ||
        function(obj) {
          return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
        };
    }

    function normalizeName(name) {
      if (typeof name !== 'string') {
        name = String(name);
      }
      if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
        throw new TypeError('Invalid character in header field name: "' + name + '"')
      }
      return name.toLowerCase()
    }

    function normalizeValue(value) {
      if (typeof value !== 'string') {
        value = String(value);
      }
      return value
    }

    // Build a destructive iterator for the value list
    function iteratorFor(items) {
      var iterator = {
        next: function() {
          var value = items.shift();
          return {done: value === undefined, value: value}
        }
      };

      if (support.iterable) {
        iterator[Symbol.iterator] = function() {
          return iterator
        };
      }

      return iterator
    }

    function Headers(headers) {
      this.map = {};

      if (headers instanceof Headers) {
        headers.forEach(function(value, name) {
          this.append(name, value);
        }, this);
      } else if (Array.isArray(headers)) {
        headers.forEach(function(header) {
          this.append(header[0], header[1]);
        }, this);
      } else if (headers) {
        Object.getOwnPropertyNames(headers).forEach(function(name) {
          this.append(name, headers[name]);
        }, this);
      }
    }

    Headers.prototype.append = function(name, value) {
      name = normalizeName(name);
      value = normalizeValue(value);
      var oldValue = this.map[name];
      this.map[name] = oldValue ? oldValue + ', ' + value : value;
    };

    Headers.prototype['delete'] = function(name) {
      delete this.map[normalizeName(name)];
    };

    Headers.prototype.get = function(name) {
      name = normalizeName(name);
      return this.has(name) ? this.map[name] : null
    };

    Headers.prototype.has = function(name) {
      return this.map.hasOwnProperty(normalizeName(name))
    };

    Headers.prototype.set = function(name, value) {
      this.map[normalizeName(name)] = normalizeValue(value);
    };

    Headers.prototype.forEach = function(callback, thisArg) {
      for (var name in this.map) {
        if (this.map.hasOwnProperty(name)) {
          callback.call(thisArg, this.map[name], name, this);
        }
      }
    };

    Headers.prototype.keys = function() {
      var items = [];
      this.forEach(function(value, name) {
        items.push(name);
      });
      return iteratorFor(items)
    };

    Headers.prototype.values = function() {
      var items = [];
      this.forEach(function(value) {
        items.push(value);
      });
      return iteratorFor(items)
    };

    Headers.prototype.entries = function() {
      var items = [];
      this.forEach(function(value, name) {
        items.push([name, value]);
      });
      return iteratorFor(items)
    };

    if (support.iterable) {
      Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
    }

    function consumed(body) {
      if (body.bodyUsed) {
        return Promise.reject(new TypeError('Already read'))
      }
      body.bodyUsed = true;
    }

    function fileReaderReady(reader) {
      return new Promise(function(resolve, reject) {
        reader.onload = function() {
          resolve(reader.result);
        };
        reader.onerror = function() {
          reject(reader.error);
        };
      })
    }

    function readBlobAsArrayBuffer(blob) {
      var reader = new FileReader();
      var promise = fileReaderReady(reader);
      reader.readAsArrayBuffer(blob);
      return promise
    }

    function readBlobAsText(blob) {
      var reader = new FileReader();
      var promise = fileReaderReady(reader);
      reader.readAsText(blob);
      return promise
    }

    function readArrayBufferAsText(buf) {
      var view = new Uint8Array(buf);
      var chars = new Array(view.length);

      for (var i = 0; i < view.length; i++) {
        chars[i] = String.fromCharCode(view[i]);
      }
      return chars.join('')
    }

    function bufferClone(buf) {
      if (buf.slice) {
        return buf.slice(0)
      } else {
        var view = new Uint8Array(buf.byteLength);
        view.set(new Uint8Array(buf));
        return view.buffer
      }
    }

    function Body() {
      this.bodyUsed = false;

      this._initBody = function(body) {
        /*
          fetch-mock wraps the Response object in an ES6 Proxy to
          provide useful test harness features such as flush. However, on
          ES5 browsers without fetch or Proxy support pollyfills must be used;
          the proxy-pollyfill is unable to proxy an attribute unless it exists
          on the object before the Proxy is created. This change ensures
          Response.bodyUsed exists on the instance, while maintaining the
          semantic of setting Request.bodyUsed in the constructor before
          _initBody is called.
        */
        this.bodyUsed = this.bodyUsed;
        this._bodyInit = body;
        if (!body) {
          this._bodyText = '';
        } else if (typeof body === 'string') {
          this._bodyText = body;
        } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
          this._bodyBlob = body;
        } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
          this._bodyFormData = body;
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this._bodyText = body.toString();
        } else if (support.arrayBuffer && support.blob && isDataView(body)) {
          this._bodyArrayBuffer = bufferClone(body.buffer);
          // IE 10-11 can't handle a DataView body.
          this._bodyInit = new Blob([this._bodyArrayBuffer]);
        } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
          this._bodyArrayBuffer = bufferClone(body);
        } else {
          this._bodyText = body = Object.prototype.toString.call(body);
        }

        if (!this.headers.get('content-type')) {
          if (typeof body === 'string') {
            this.headers.set('content-type', 'text/plain;charset=UTF-8');
          } else if (this._bodyBlob && this._bodyBlob.type) {
            this.headers.set('content-type', this._bodyBlob.type);
          } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
            this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
          }
        }
      };

      if (support.blob) {
        this.blob = function() {
          var rejected = consumed(this);
          if (rejected) {
            return rejected
          }

          if (this._bodyBlob) {
            return Promise.resolve(this._bodyBlob)
          } else if (this._bodyArrayBuffer) {
            return Promise.resolve(new Blob([this._bodyArrayBuffer]))
          } else if (this._bodyFormData) {
            throw new Error('could not read FormData body as blob')
          } else {
            return Promise.resolve(new Blob([this._bodyText]))
          }
        };

        this.arrayBuffer = function() {
          if (this._bodyArrayBuffer) {
            var isConsumed = consumed(this);
            if (isConsumed) {
              return isConsumed
            }
            if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
              return Promise.resolve(
                this._bodyArrayBuffer.buffer.slice(
                  this._bodyArrayBuffer.byteOffset,
                  this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
                )
              )
            } else {
              return Promise.resolve(this._bodyArrayBuffer)
            }
          } else {
            return this.blob().then(readBlobAsArrayBuffer)
          }
        };
      }

      this.text = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      };

      if (support.formData) {
        this.formData = function() {
          return this.text().then(decode)
        };
      }

      this.json = function() {
        return this.text().then(JSON.parse)
      };

      return this
    }

    // HTTP methods whose capitalization should be normalized
    var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

    function normalizeMethod(method) {
      var upcased = method.toUpperCase();
      return methods.indexOf(upcased) > -1 ? upcased : method
    }

    function Request(input, options) {
      if (!(this instanceof Request)) {
        throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
      }

      options = options || {};
      var body = options.body;

      if (input instanceof Request) {
        if (input.bodyUsed) {
          throw new TypeError('Already read')
        }
        this.url = input.url;
        this.credentials = input.credentials;
        if (!options.headers) {
          this.headers = new Headers(input.headers);
        }
        this.method = input.method;
        this.mode = input.mode;
        this.signal = input.signal;
        if (!body && input._bodyInit != null) {
          body = input._bodyInit;
          input.bodyUsed = true;
        }
      } else {
        this.url = String(input);
      }

      this.credentials = options.credentials || this.credentials || 'same-origin';
      if (options.headers || !this.headers) {
        this.headers = new Headers(options.headers);
      }
      this.method = normalizeMethod(options.method || this.method || 'GET');
      this.mode = options.mode || this.mode || null;
      this.signal = options.signal || this.signal;
      this.referrer = null;

      if ((this.method === 'GET' || this.method === 'HEAD') && body) {
        throw new TypeError('Body not allowed for GET or HEAD requests')
      }
      this._initBody(body);

      if (this.method === 'GET' || this.method === 'HEAD') {
        if (options.cache === 'no-store' || options.cache === 'no-cache') {
          // Search for a '_' parameter in the query string
          var reParamSearch = /([?&])_=[^&]*/;
          if (reParamSearch.test(this.url)) {
            // If it already exists then set the value with the current time
            this.url = this.url.replace(reParamSearch, '$1_=' + new Date().getTime());
          } else {
            // Otherwise add a new '_' parameter to the end with the current time
            var reQueryString = /\?/;
            this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + new Date().getTime();
          }
        }
      }
    }

    Request.prototype.clone = function() {
      return new Request(this, {body: this._bodyInit})
    };

    function decode(body) {
      var form = new FormData();
      body
        .trim()
        .split('&')
        .forEach(function(bytes) {
          if (bytes) {
            var split = bytes.split('=');
            var name = split.shift().replace(/\+/g, ' ');
            var value = split.join('=').replace(/\+/g, ' ');
            form.append(decodeURIComponent(name), decodeURIComponent(value));
          }
        });
      return form
    }

    function parseHeaders(rawHeaders) {
      var headers = new Headers();
      // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
      // https://tools.ietf.org/html/rfc7230#section-3.2
      var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
      // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
      // https://github.com/github/fetch/issues/748
      // https://github.com/zloirock/core-js/issues/751
      preProcessedHeaders
        .split('\r')
        .map(function(header) {
          return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header
        })
        .forEach(function(line) {
          var parts = line.split(':');
          var key = parts.shift().trim();
          if (key) {
            var value = parts.join(':').trim();
            headers.append(key, value);
          }
        });
      return headers
    }

    Body.call(Request.prototype);

    function Response(bodyInit, options) {
      if (!(this instanceof Response)) {
        throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
      }
      if (!options) {
        options = {};
      }

      this.type = 'default';
      this.status = options.status === undefined ? 200 : options.status;
      this.ok = this.status >= 200 && this.status < 300;
      this.statusText = options.statusText === undefined ? '' : '' + options.statusText;
      this.headers = new Headers(options.headers);
      this.url = options.url || '';
      this._initBody(bodyInit);
    }

    Body.call(Response.prototype);

    Response.prototype.clone = function() {
      return new Response(this._bodyInit, {
        status: this.status,
        statusText: this.statusText,
        headers: new Headers(this.headers),
        url: this.url
      })
    };

    Response.error = function() {
      var response = new Response(null, {status: 0, statusText: ''});
      response.type = 'error';
      return response
    };

    var redirectStatuses = [301, 302, 303, 307, 308];

    Response.redirect = function(url, status) {
      if (redirectStatuses.indexOf(status) === -1) {
        throw new RangeError('Invalid status code')
      }

      return new Response(null, {status: status, headers: {location: url}})
    };

    var DOMException = global$1.DOMException;
    try {
      new DOMException();
    } catch (err) {
      DOMException = function(message, name) {
        this.message = message;
        this.name = name;
        var error = Error(message);
        this.stack = error.stack;
      };
      DOMException.prototype = Object.create(Error.prototype);
      DOMException.prototype.constructor = DOMException;
    }

    function fetch$1(input, init) {
      return new Promise(function(resolve, reject) {
        var request = new Request(input, init);

        if (request.signal && request.signal.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'))
        }

        var xhr = new XMLHttpRequest();

        function abortXhr() {
          xhr.abort();
        }

        xhr.onload = function() {
          var options = {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: parseHeaders(xhr.getAllResponseHeaders() || '')
          };
          options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
          var body = 'response' in xhr ? xhr.response : xhr.responseText;
          setTimeout(function() {
            resolve(new Response(body, options));
          }, 0);
        };

        xhr.onerror = function() {
          setTimeout(function() {
            reject(new TypeError('Network request failed'));
          }, 0);
        };

        xhr.ontimeout = function() {
          setTimeout(function() {
            reject(new TypeError('Network request failed'));
          }, 0);
        };

        xhr.onabort = function() {
          setTimeout(function() {
            reject(new DOMException('Aborted', 'AbortError'));
          }, 0);
        };

        function fixUrl(url) {
          try {
            return url === '' && global$1.location.href ? global$1.location.href : url
          } catch (e) {
            return url
          }
        }

        xhr.open(request.method, fixUrl(request.url), true);

        if (request.credentials === 'include') {
          xhr.withCredentials = true;
        } else if (request.credentials === 'omit') {
          xhr.withCredentials = false;
        }

        if ('responseType' in xhr) {
          if (support.blob) {
            xhr.responseType = 'blob';
          } else if (
            support.arrayBuffer &&
            request.headers.get('Content-Type') &&
            request.headers.get('Content-Type').indexOf('application/octet-stream') !== -1
          ) {
            xhr.responseType = 'arraybuffer';
          }
        }

        if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
          Object.getOwnPropertyNames(init.headers).forEach(function(name) {
            xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
          });
        } else {
          request.headers.forEach(function(value, name) {
            xhr.setRequestHeader(name, value);
          });
        }

        if (request.signal) {
          request.signal.addEventListener('abort', abortXhr);

          xhr.onreadystatechange = function() {
            // DONE (success or failure)
            if (xhr.readyState === 4) {
              request.signal.removeEventListener('abort', abortXhr);
            }
          };
        }

        xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
      })
    }

    fetch$1.polyfill = true;

    if (!global$1.fetch) {
      global$1.fetch = fetch$1;
      global$1.Headers = Headers;
      global$1.Request = Request;
      global$1.Response = Response;
    }

    var fetch$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Headers: Headers,
        Request: Request,
        Response: Response,
        get DOMException () { return DOMException; },
        fetch: fetch$1
    });

    /**
     * @this {Promise}
     */
    function finallyConstructor(callback) {
      var constructor = this.constructor;
      return this.then(
        function(value) {
          // @ts-ignore
          return constructor.resolve(callback()).then(function() {
            return value;
          });
        },
        function(reason) {
          // @ts-ignore
          return constructor.resolve(callback()).then(function() {
            // @ts-ignore
            return constructor.reject(reason);
          });
        }
      );
    }

    function allSettled(arr) {
      var P = this;
      return new P(function(resolve, reject) {
        if (!(arr && typeof arr.length !== 'undefined')) {
          return reject(
            new TypeError(
              typeof arr +
                ' ' +
                arr +
                ' is not iterable(cannot read property Symbol(Symbol.iterator))'
            )
          );
        }
        var args = Array.prototype.slice.call(arr);
        if (args.length === 0) return resolve([]);
        var remaining = args.length;

        function res(i, val) {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(
                val,
                function(val) {
                  res(i, val);
                },
                function(e) {
                  args[i] = { status: 'rejected', reason: e };
                  if (--remaining === 0) {
                    resolve(args);
                  }
                }
              );
              return;
            }
          }
          args[i] = { status: 'fulfilled', value: val };
          if (--remaining === 0) {
            resolve(args);
          }
        }

        for (var i = 0; i < args.length; i++) {
          res(i, args[i]);
        }
      });
    }

    // Store setTimeout reference so promise-polyfill will be unaffected by
    // other code modifying setTimeout (like sinon.useFakeTimers())
    var setTimeoutFunc = setTimeout;

    function isArray(x) {
      return Boolean(x && typeof x.length !== 'undefined');
    }

    function noop() {}

    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
      return function() {
        fn.apply(thisArg, arguments);
      };
    }

    /**
     * @constructor
     * @param {Function} fn
     */
    function Promise$1(fn) {
      if (!(this instanceof Promise$1))
        throw new TypeError('Promises must be constructed via new');
      if (typeof fn !== 'function') throw new TypeError('not a function');
      /** @type {!number} */
      this._state = 0;
      /** @type {!boolean} */
      this._handled = false;
      /** @type {Promise|undefined} */
      this._value = undefined;
      /** @type {!Array<!Function>} */
      this._deferreds = [];

      doResolve(fn, this);
    }

    function handle(self, deferred) {
      while (self._state === 3) {
        self = self._value;
      }
      if (self._state === 0) {
        self._deferreds.push(deferred);
        return;
      }
      self._handled = true;
      Promise$1._immediateFn(function() {
        var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
          (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
          return;
        }
        var ret;
        try {
          ret = cb(self._value);
        } catch (e) {
          reject(deferred.promise, e);
          return;
        }
        resolve(deferred.promise, ret);
      });
    }

    function resolve(self, newValue) {
      try {
        // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self)
          throw new TypeError('A promise cannot be resolved with itself.');
        if (
          newValue &&
          (typeof newValue === 'object' || typeof newValue === 'function')
        ) {
          var then = newValue.then;
          if (newValue instanceof Promise$1) {
            self._state = 3;
            self._value = newValue;
            finale(self);
            return;
          } else if (typeof then === 'function') {
            doResolve(bind(then, newValue), self);
            return;
          }
        }
        self._state = 1;
        self._value = newValue;
        finale(self);
      } catch (e) {
        reject(self, e);
      }
    }

    function reject(self, newValue) {
      self._state = 2;
      self._value = newValue;
      finale(self);
    }

    function finale(self) {
      if (self._state === 2 && self._deferreds.length === 0) {
        Promise$1._immediateFn(function() {
          if (!self._handled) {
            Promise$1._unhandledRejectionFn(self._value);
          }
        });
      }

      for (var i = 0, len = self._deferreds.length; i < len; i++) {
        handle(self, self._deferreds[i]);
      }
      self._deferreds = null;
    }

    /**
     * @constructor
     */
    function Handler(onFulfilled, onRejected, promise) {
      this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
      this.onRejected = typeof onRejected === 'function' ? onRejected : null;
      this.promise = promise;
    }

    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, self) {
      var done = false;
      try {
        fn(
          function(value) {
            if (done) return;
            done = true;
            resolve(self, value);
          },
          function(reason) {
            if (done) return;
            done = true;
            reject(self, reason);
          }
        );
      } catch (ex) {
        if (done) return;
        done = true;
        reject(self, ex);
      }
    }

    Promise$1.prototype['catch'] = function(onRejected) {
      return this.then(null, onRejected);
    };

    Promise$1.prototype.then = function(onFulfilled, onRejected) {
      // @ts-ignore
      var prom = new this.constructor(noop);

      handle(this, new Handler(onFulfilled, onRejected, prom));
      return prom;
    };

    Promise$1.prototype['finally'] = finallyConstructor;

    Promise$1.all = function(arr) {
      return new Promise$1(function(resolve, reject) {
        if (!isArray(arr)) {
          return reject(new TypeError('Promise.all accepts an array'));
        }

        var args = Array.prototype.slice.call(arr);
        if (args.length === 0) return resolve([]);
        var remaining = args.length;

        function res(i, val) {
          try {
            if (val && (typeof val === 'object' || typeof val === 'function')) {
              var then = val.then;
              if (typeof then === 'function') {
                then.call(
                  val,
                  function(val) {
                    res(i, val);
                  },
                  reject
                );
                return;
              }
            }
            args[i] = val;
            if (--remaining === 0) {
              resolve(args);
            }
          } catch (ex) {
            reject(ex);
          }
        }

        for (var i = 0; i < args.length; i++) {
          res(i, args[i]);
        }
      });
    };

    Promise$1.allSettled = allSettled;

    Promise$1.resolve = function(value) {
      if (value && typeof value === 'object' && value.constructor === Promise$1) {
        return value;
      }

      return new Promise$1(function(resolve) {
        resolve(value);
      });
    };

    Promise$1.reject = function(value) {
      return new Promise$1(function(resolve, reject) {
        reject(value);
      });
    };

    Promise$1.race = function(arr) {
      return new Promise$1(function(resolve, reject) {
        if (!isArray(arr)) {
          return reject(new TypeError('Promise.race accepts an array'));
        }

        for (var i = 0, len = arr.length; i < len; i++) {
          Promise$1.resolve(arr[i]).then(resolve, reject);
        }
      });
    };

    // Use polyfill for setImmediate for performance gains
    Promise$1._immediateFn =
      // @ts-ignore
      (typeof setImmediate === 'function' &&
        function(fn) {
          // @ts-ignore
          setImmediate(fn);
        }) ||
      function(fn) {
        setTimeoutFunc(fn, 0);
      };

    Promise$1._unhandledRejectionFn = function _unhandledRejectionFn(err) {
      if (typeof console !== 'undefined' && console) {
        console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
      }
    };

    /** @suppress {undefinedVars} */
    var globalNS = (function() {
      // the only reliable means to get the global object is
      // `Function('return this')()`
      // However, this causes CSP violations in Chrome apps.
      if (typeof self !== 'undefined') {
        return self;
      }
      if (typeof window !== 'undefined') {
        return window;
      }
      if (typeof global !== 'undefined') {
        return global;
      }
      throw new Error('unable to locate global object');
    })();

    // Expose the polyfill if Promise is undefined or set to a
    // non-function value. The latter can be due to a named HTMLElement
    // being exposed by browsers for legacy reasons.
    // https://github.com/taylorhakes/promise-polyfill/issues/114
    if (typeof globalNS['Promise'] !== 'function') {
      globalNS['Promise'] = Promise$1;
    } else {
      if (!globalNS.Promise.prototype['finally']) {
        globalNS.Promise.prototype['finally'] = finallyConstructor;
      } 
      if (!globalNS.Promise.allSettled) {
        globalNS.Promise.allSettled = allSettled;
      }
    }

    var polyfill = /*#__PURE__*/Object.freeze({
        __proto__: null
    });

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    }

    var e$4,n$8=new Promise((function(n){e$4=n;}));

    var index_es$p = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get done () { return e$4; },
        ready: n$8
    });

    var e$3="UNKNOWN",I$3="UNAUTHORIZED",i$5="INVALID_ARGUMENT",t$1="INIT_FAILED",E$4="FORBIDDEN",T$3="INVALID_CONFIG",_$3="INVALID_ID_TOKEN",n$7="CREATE_SUBWINDOW_FAILED",N$1="EXCEPTION_IN_SUBWINDOW",l$8="liffEvent",o$4="LIFF_STORE",s$c="https://liff.line.me/",r$2={ACCESS_TOKEN:"accessToken",ID_TOKEN:"IDToken",DECODED_ID_TOKEN:"decodedIDToken",FEATURE_TOKEN:"featureToken",LOGIN_TMP:"loginTmp",CONFIG:"config",CONTEXT:"context",EXPIRES:"expires",RAW_CONTEXT:"rawContext",CLIENT_ID:"clientId",IS_SUBSEQUENT_LIFF_APP:"isSubsequentLiffApp",MST_CHALLENGE:"mstChallenge",MSIT:"msit",MST:"mst",MST_VERIFIER:"mstVerifier",APP_DATA:"appData"},D$1="isInClient",O$3=["context_token","feature_token","access_token","id_token","client_id","mst_verifier","mst_challenge","msit"],a$5=5,c$a=["liff.ref.source","liff.ref.medium","liff.ref.campaign","liff.ref.term","liff.ref.content"],A$3="liff://subwindow",C$2={INIT:"init",SUBMIT:"submit",CANCEL:"cancel",CLOSE:"close",ERROR:"error"},m$9=100,S$3=100,L$2="liff.subwindow",p$8="healthCheck",F$3=["profile","chat_message.write","openid","email"];

    var t;!function(o){o[o.DEBUG=1]="DEBUG",o[o.INFO=2]="INFO",o[o.WARN=3]="WARN",o[o.ERROR=4]="ERROR";}(t||(t={}));var n$6=function(){function n(o){void 0===o&&(o=t.INFO),this.logLevel=o,this._debug=console.debug,this._info=console.info,this._warn=console.warn,this._error=console.error;}return n.prototype.debug=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];this.logLevel<=t.DEBUG&&(n.unshift("[DEBUG]"),this._debug.apply(this,__spread(n)));},n.prototype.info=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];this.logLevel<=t.INFO&&(n.unshift("[INFO]"),this._info.apply(this,__spread(n)));},n.prototype.warn=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];this.logLevel<=t.WARN&&(n.unshift("[WARN]"),this._warn.apply(this,__spread(n)));},n.prototype.error=function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];this.logLevel<=t.ERROR&&(n.unshift("[ERROR]"),this._error.apply(this,__spread(n)));},n}(),r$1=new n$6(Number("3"));

    function c$9(n){return window.atob(n.replace(/-/g,"+").replace(/_/g,"/"))}var u$8={decode:c$9,encode:function(n){return window.btoa(n).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},decodeUnicode:function(n){var r=c$9(n).split("").map((function(n){return "%"+("00"+n.charCodeAt(0).toString(16)).slice(-2)})).join("");return decodeURIComponent(r)}};function f$8(n,r){if(n===r)return 0;for(var e=n.split("."),t=r.split("."),o=Math.max(e.length,t.length),i=0;i<o;i++){e[i]||(e[i]="0"),t[i]||(t[i]="0");var a=parseInt(e[i])-parseInt(t[i]);if(0!==a)return a>0?1:-1}return 0}function l$7(r){var e=r.replace("#","").match(/.{2}/g)||[];if(4!==e.length)return r$1.warn("convertArgbToRgba: Received invalid ARGB color"),"";var t=function(n){var r=p$7(n);return Math.round(r/255*100)/100}(e[0]);return "rgba("+p$7(e[1])+", "+p$7(e[2])+", "+p$7(e[3])+", "+t+")"}function p$7(n){return parseInt(n,16)}function d$4(r){var e=r.replace("#","").match(/.{2}/g)||[];return 3!==e.length?(r$1.warn("convertArgbToRgba: Received invalid hex color"),""):p$7(e[0])+", "+p$7(e[1])+", "+p$7(e[2])}function s$b(n){for(var r=n.length,e=new ArrayBuffer(r),t=new Uint8Array(e),o=0;o<r;o++)t[o]=n.charCodeAt(o);return e}var v$4={get:function(n){var r=new RegExp("(?:(?:^|.*;\\s*)"+n+"\\s*\\=\\s*([^;]*).*$)|^.*$");return document.cookie.replace(r,"$1")},set:function(r,e,t){var o=r+"="+e;if(t)for(var i in t){o+="; "+i+(t[i]?"="+t[i]:"");}r$1.debug("set cookie",o),document.cookie=o;},remove:function(n,r){var e=n+"=; expires=Thu, 01 Jan 1970 00:00:00 GMT";if(r)for(var t in r)e+="; "+t+"="+r[t];document.cookie=e;}},g$5=new Set(["400","401","403","404","429","500"]),h$4=function(n){function e(r,e){var t=n.call(this,e)||this;return t.code=r,t}return __extends(e,n),e}(Error);function m$8(n,r){return new h$4(n,r||"")}function w$2(n){var r=n.match(/([^-]+)-[^-]+/);return r&&r[1]}function y$2(n){var r="";return n.replace(/\r|\n/g,"").replace(/([\da-fA-F]{2}) ?/g,"0x$1 ").replace(/ +$/,"").split(" ").forEach((function(n){r+=String.fromCharCode(parseInt(n));})),window.btoa(r)}var b$3=new(function(){function n(){this.map={};}return n.prototype.clear=function(){this.map={};},n.prototype.getItem=function(n){var r=this.map[n];return void 0===r?null:r},n.prototype.setItem=function(n,r){this.map[n]=r;},n.prototype.removeItem=function(n){delete this.map[n];},n.prototype.key=function(n){var r=Object.keys(this.map)[n];return void 0===r?null:r},Object.defineProperty(n.prototype,"length",{get:function(){return Object.keys(this.map).length},enumerable:!1,configurable:!0}),n}());var A$2={parse:function(n){return n.replace(/^\?/,"").replace(/^#\/?/,"").split(/&+/).filter((function(n){return n.length>0})).reduce((function(n,r){var t=__read(r.split("=").map(decodeURIComponent),2),o=t[0],i=t[1],a=n[o];return Array.isArray(a)?a.push(i):Object.prototype.hasOwnProperty.call(n,o)?n[o]=[a,i]:n[o]=i,n}),{})},stringify:function(n){return Object.keys(n).map((function(r){var e=n[r],t=function(n){return void 0!==n?encodeURIComponent(r)+"="+encodeURIComponent(n):encodeURIComponent(r)};return Array.isArray(e)?e.map((function(n){return t(n)})).join("&"):t(e)})).join("&")}},R$2="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";function I$2(){return window.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}function U$1(n){for(var r="",e=0;e<n;e++)r+=R$2[Math.floor(I$2()*R$2.length)];return r}function x$3(n){var r=new URL(n),e=r.hash.slice(1).split("&").filter((function(n){return !O$3.some((function(r){return n.includes(r+"=")}))})).join("&");return r.hash=e,r.toString()}function j$2(n){var r=new URL(n);return r.toString().replace(new RegExp(String.raw(C$1||(C$1=__makeTemplateObject(["^",""],["^",""])),r.origin)),"")}var C$1,L$1=function(n){var r=j$2(x$3(n));window.history.replaceState(history.state,"",r);};function O$2(n,r){if(!n)throw new Error("addParamsToUrl: invalid URL");var t=new URL(n);return Object.entries(r).forEach((function(n){var r=__read(n,2),o=r[0],i=r[1];t.searchParams.set(o,i);})),t.toString()}function k$3(n){var r,e=n.match((r=s$c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),new RegExp("^"+r+"(\\d+-\\w+)")));return e&&e[1]}function S$2(n){var r=n.match(/^(https?:\/\/.*?)\//);return r&&r[1]||""}function $$1(n){return void 0===n&&(n=window.navigator.userAgent),/ipad/.test(n.toLowerCase())}function F$2(n){return void 0===n&&(n=window.navigator.userAgent),/Line\/\d+\.\d+\.\d+/.test(n)}function T$2(n){return void 0===n&&(n=window.navigator.userAgent),/Line\/\d+\.\d+\.\d+ LIFF/.test(n)}function M$1(n){return void 0===n&&(n=window.navigator.userAgent),/LIFF\/SubWindow/.test(n)}function P$2(n){for(var r,e,t=[],i=1;i<arguments.length;i++)t[i-1]=arguments[i];var a=function(r){Object.keys(r).filter((function(n){return null!==r[n]&&void 0!==r[n]})).forEach((function(e){n[e]=r[e];}));};try{for(var c=__values(t),u=c.next();!u.done;u=c.next()){var f=u.value;a(f);}}catch(l){r={error:l};}finally{try{u&&!u.done&&(e=c.return)&&e.call(c);}finally{if(r)throw r.error}}return n}

    var s$a=null;function i$4(){return null===s$a&&(s$a=T$2()||F$2()&&/[#|&]access_token=/.test(location.hash)||"1"===sessionStorage.getItem(o$4+":"+D$1),sessionStorage.setItem(o$4+":"+D$1,s$a?"1":"0")),!!s$a}function l$6(){s$a=null;}

    var index_es$o = /*#__PURE__*/Object.freeze({
        __proto__: null,
        _cleanupCachedIsInClient: l$6,
        isInClient: i$4
    });

    var u$7={};function e$2(){return u$7}function c$8(n){u$7=n;}function E$3(i,o){if(!o)throw m$8(T$3,"liffId is necessary for liff.init()");var u=(i$4()?sessionStorage:localStorage).getItem(o$4+":"+o+":"+i);try{return null===u?null:JSON.parse(u)}catch(e){return null}}function I$1(n){return E$3(n,e$2().liffId)}function l$5(i,o){var u=e$2().liffId;if(!u)throw m$8(T$3,"liffId is necessary for liff.init()");(i$4()?sessionStorage:localStorage).setItem(o$4+":"+u+":"+i,JSON.stringify(o));}function T$1(){return I$1(r$2.CONTEXT)}function S$1(n){l$5(r$2.CONTEXT,n);}function s$9(){return ((T$1()||{}).d||{}).aId}function a$4(){return ((T$1()||{}).d||{}).autoplay||!1}function _$2(){return (T$1()||{}).profilePlus}function N(){return Boolean(I$1(r$2.IS_SUBSEQUENT_LIFF_APP))}function O$1(n){l$5(r$2.IS_SUBSEQUENT_LIFF_APP,n);}function A$1(){return I$1(r$2.APP_DATA)}function P$1(n){l$5(r$2.APP_DATA,n);}function C(){return I$1(r$2.MST_VERIFIER)}function D(n){l$5(r$2.MST_VERIFIER,n);}function d$3(){return I$1(r$2.MSIT)}function m$7(n){l$5(r$2.MSIT,n);}function g$4(){return I$1(r$2.MST)}function L(n){l$5(r$2.MST,n);}function M(){return I$1(r$2.MST_CHALLENGE)}function p$6(n){l$5(r$2.MST_CHALLENGE,n);}function R$1(){return I$1(r$2.CLIENT_ID)}function v$3(n){l$5(r$2.CLIENT_ID,n);}function F$1(){return I$1(r$2.RAW_CONTEXT)}function K$1(){return I$1(r$2.FEATURE_TOKEN)}function h$3(n){l$5(r$2.FEATURE_TOKEN,n);}function y$1(){return I$1(r$2.ID_TOKEN)}function U(n){l$5(r$2.ID_TOKEN,n);}function X$1(){return I$1(r$2.ACCESS_TOKEN)}function G$1(n){l$5(r$2.ACCESS_TOKEN,n);}function w$1(i){var o=e$2().liffId;if(!o)throw m$8(T$3,"liffId is necessary for liff.init()");(i$4()?sessionStorage:localStorage).removeItem(o$4+":"+o+":"+i);}function B(){return I$1(r$2.LOGIN_TMP)}function x$2(n){l$5(r$2.LOGIN_TMP,n);}function H$1(){w$1(r$2.LOGIN_TMP);}function J(n){var f=e$2();v$4.set(o$4+":"+r$2.EXPIRES+":"+f.liffId,n.getTime(),{expires:n.toUTCString(),path:"/",secure:null});}function Q$1(){var n=e$2();return v$4.get(o$4+":"+r$2.EXPIRES+":"+n.liffId)}function V$1(){var n=e$2();v$4.remove(o$4+":"+r$2.EXPIRES+":"+n.liffId,{path:"/"});}function b$2(){return I$1(r$2.DECODED_ID_TOKEN)}function j$1(n){l$5(r$2.DECODED_ID_TOKEN,n);}function k$2(){Object.keys(r$2).forEach((function(n){w$1(r$2[n]);})),V$1();}

    var index_es$n = /*#__PURE__*/Object.freeze({
        __proto__: null,
        clean: k$2,
        get: I$1,
        getAId: s$9,
        getAccessToken: X$1,
        getAppData: A$1,
        getByLiffId: E$3,
        getClientId: R$1,
        getConfig: e$2,
        getContext: T$1,
        getDecodedIDToken: b$2,
        getExpireTime: Q$1,
        getFeatureToken: K$1,
        getIDToken: y$1,
        getIsSubsequentLiffApp: N,
        getIsVideoAutoPlay: a$4,
        getLoginTmp: B,
        getMSIT: d$3,
        getMST: g$4,
        getMSTChallenge: M,
        getMSTVerifier: C,
        getProfilePlus: _$2,
        getRawContext: F$1,
        remove: w$1,
        removeExpireTime: V$1,
        removeLoginTmp: H$1,
        set: l$5,
        setAccessToken: G$1,
        setAppData: P$1,
        setClientId: v$3,
        setConfig: c$8,
        setContext: S$1,
        setDecodedIDToken: j$1,
        setExpireTime: J,
        setFeatureToken: h$3,
        setIDToken: U,
        setIsSubsequentLiffApp: O$1,
        setLoginTmp: x$2,
        setMSIT: m$7,
        setMST: L,
        setMSTChallenge: p$6,
        setMSTVerifier: D
    });

    function o$3(){return !!X$1()}

    var index_es$m = /*#__PURE__*/Object.freeze({
        __proto__: null,
        isLoggedIn: o$3
    });

    var o$2;function i$3(){if(!o$2){var i=window.navigator.userAgent.toLowerCase();o$2=/iphone|ipad|ipod/.test(i)?"ios":/android/.test(i)?"android":"web";}return o$2}function n$5(){o$2=void 0;}

    var index_es$l = /*#__PURE__*/Object.freeze({
        __proto__: null,
        _cleanupCachedOS: n$5,
        getOS: i$3
    });

    function n$4(){var n=navigator.userAgent.match(/Line\/\d+(\.\d+)*/i);return n?n[0].slice(5):null}

    var index_es$k = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getLineVersion: n$4
    });

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */function i$2(t,n,e,o){return new(e||(e=Promise))((function(r,i){function l(t){try{c(o.next(t));}catch(n){i(n);}}function s(t){try{c(o.throw(t));}catch(n){i(n);}}function c(t){var n;t.done?r(t.value):(n=t.value,n instanceof e?n:new e((function(t){t(n);}))).then(l,s);}c((o=o.apply(t,n||[])).next());}))}function l$4(t,n){var e,o,r,i,l={label:0,sent:function(){if(1&r[0])throw r[1];return r[1]},trys:[],ops:[]};return i={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function s(i){return function(s){return function(i){if(e)throw new TypeError("Generator is already executing.");for(;l;)try{if(e=1,o&&(r=2&i[0]?o.return:i[0]?o.throw||((r=o.return)&&r.call(o),0):o.next)&&!(r=r.call(o,i[1])).done)return r;switch(o=0,r&&(i=[2&i[0],r.value]),i[0]){case 0:case 1:r=i;break;case 4:return l.label++,{value:i[1],done:!1};case 5:l.label++,o=i[1],i=[0];continue;case 7:i=l.ops.pop(),l.trys.pop();continue;default:if(!(r=l.trys,(r=r.length>0&&r[r.length-1])||6!==i[0]&&2!==i[0])){l=0;continue}if(3===i[0]&&(!r||i[1]>r[0]&&i[1]<r[3])){l.label=i[1];break}if(6===i[0]&&l.label<r[1]){l.label=r[1],r=i;break}if(r&&l.label<r[2]){l.label=r[2],l.ops.push(i);break}r[2]&&l.ops.pop(),l.trys.pop();continue}i=n.call(t,l);}catch(s){i=[6,s],o=0;}finally{e=r=0;}if(5&i[0])throw i[1];return {value:i[0]?i[1]:void 0,done:!0}}([i,s])}}}function s$8(){var t;return "ios"===i$3()?(t=n$4())&&f$8(t,"9.19.0")<0?"https://static.line-scdn.net/liff/edge/2/ios-918-extensions.js":"https://static.line-scdn.net/liff/edge/2/ios-extensions.js":"https://static.line-scdn.net/liff/edge/2/non-ios-extensions.js"}function c$7(){return function(){return i$2(this,void 0,void 0,(function(){return l$4(this,(function(e){switch(e.label){case 0:return [3,2];case 1:return [2,e.sent().default];case 2:return [2,new Promise((function(e,o){var r=document.createElement("script"),i=s$8();r.onload=function(){var r=window.liffClientExtension;r?e(r):o(m$8(t$1,"Unable to load client features. (Extension is empty)"));},r.onerror=function(){o(m$8(t$1,"Unable to load client features."));},r.src=i,r.type="text/javascript",document.body.appendChild(r);}))]}}))}))}()}

    function f$7(){k$2();}

    var index_es$j = /*#__PURE__*/Object.freeze({
        __proto__: null,
        logout: f$7
    });

    var u$6=function(){function t(){}return t.prototype.invoke=function(){return M$1()},t}(),s$7=function(){function o(t){this.storage=t;}return Object.defineProperty(o,"IN_SUB_WINDOW_KEY",{get:function(){return "inSubWindow"},enumerable:!1,configurable:!0}),o.prototype.invoke=function(){return !(!this.getInSubWindow()&&!this.getSubWindowIdentifier())||!!new URLSearchParams(window.location.search).has(L$2)&&(this.setInSubWindow(!0),!0)},o.prototype.getInSubWindow=function(){var t=this.storage.getItem(o$4+":"+this.getLiffId()+":"+o.IN_SUB_WINDOW_KEY);return null!==t&&JSON.parse(t)},o.prototype.getSubWindowIdentifier=function(){var t,n,i="liff.subwindow.identifier",e=new URLSearchParams(window.location.search);return e.get(i)||(t=i,(n=e.get("liff.state"))?new URLSearchParams(n).get(t):null)||null},o.prototype.setInSubWindow=function(t){this.storage.setItem(o$4+":"+this.getLiffId()+":"+o.IN_SUB_WINDOW_KEY,String(t));},o.prototype.getLiffId=function(){var t=e$2().liffId;if(!t)throw m$8(T$3,"liffId is necessary for liff.init()");return t},o}(),a$3=function(){function t(){i$4()?this.impl=new u$6:this.impl=new s$7(window.sessionStorage);}return Object.defineProperty(t.prototype,"name",{get:function(){return "isSubWindow"},enumerable:!1,configurable:!0}),t.prototype.install=function(){return this.impl.invoke.bind(this.impl)},t}(),l$3=new a$3,c$6=l$3.install();

    var index_es$i = /*#__PURE__*/Object.freeze({
        __proto__: null,
        IsSubWindowModule: a$3,
        isSubWindow: c$6,
        module: l$3
    });

    var f$6=["subwindowOpen","shareTargetPicker","multipleLiffTransition","scanCode","scanCodeV2","getAdvertisingId","addToHomeScreen","bluetoothLeFunction","skipChannelVerificationScreen"];function a$2(n){var r,i=T$1();return null===(r=null==i?void 0:i.availability)||void 0===r?void 0:r[n]}function s$6(n,r){var e=n$4();return !!e&&(!(r&&f$8(e,r)>0)&&f$8(e,n)>=0)}function c$5(n){var r=a$2(n);if(!r)return !1;var i=r.permission,e=r.minVer,o=r.unsupportedFromVer;return !!i&&(!!i$4()&&s$6(e,o))}var l$2={shareTargetPicker:function(){if(!o$3())return !1;var n=a$2("shareTargetPicker");if(!n)return !1;var r=n.permission,e=n.minVer;if(!r)return !1;if(i$4()){var f=n$4();return null!==f&&f$8(f,e)>=0}return !0},multipleLiffTransition:function(){var n=a$2("multipleLiffTransition");if(!n)return !1;var r=n.permission;return i$4()&&r},subwindowOpen:function(){var n=a$2("subwindowOpen");return !(!n||!n.permission)&&(!i$4()||s$6(n.minVer,n.unsupportedFromVer))},scanCode:function(){return c$5("scanCode")},scanCodeV2:function(){if(!o$3())return !1;var n=a$2("scanCodeV2");return !(!n||!n.permission)&&(!i$4()||s$6(n.minVer))},getAdvertisingId:function(){return c$5("getAdvertisingId")},addToHomeScreen:function(){return c$5("addToHomeScreen")},bluetoothLeFunction:function(){return c$5("bluetoothLeFunction")},skipChannelVerificationScreen:function(){return c$5("skipChannelVerificationScreen")}};function m$6(i){if(!f$6.includes(i))throw m$8(i$5,"Unexpected API name.");var e=l$2[i];return !e||e()}

    var index_es$h = /*#__PURE__*/Object.freeze({
        __proto__: null,
        isApiAvailable: m$6
    });

    function u$5(e){return __awaiter(this,void 0,void 0,(function(){var t,r,o;return __generator(this,(function(a){switch(a.label){case 0:if(!e.ok)return [3,4];a.label=1;case 1:return a.trys.push([1,3,,4]),[4,e.json()];case 2:return [2,a.sent()];case 3:return a.sent(),[2,e];case 4:return t=String(e.status),r=g$5.has(t)?t:e$3,[4,e.json().catch((function(){throw m$8(r,e.statusText)}))];case 5:throw o=a.sent(),m$8(o.error||r,o.error_description||o.message)}}))}))}function f$5(t){var a=function(e){if(e)return e;var t=X$1();if(!t)throw m$8(I$3,"Need access_token for api call, Please login first");return {"Content-Type":"application/json",Accept:"application/json",Authorization:"Bearer "+t}}(t&&t.headers);return __assign(__assign({},t),{headers:a})}function c$4(e,t){var a;try{a=f$5(t);}catch(n){return Promise.reject(n)}return fetch(e,a).then(u$5)}function p$5(e,t){var a;try{a=f$5(t);}catch(n){return Promise.reject(n)}return fetch(e,a)}function h$2(e){var t=e.subdomain;return "https://"+(void 0===t?"api":t)+".line.me/"+e.pathname}var m$5={token:h$2({pathname:"oauth2/v2.1/token"}),certs:h$2({pathname:"oauth2/v2.1/certs"}),"openid-configuration":h$2({subdomain:"access",pathname:".well-known/openid-configuration"}),authorize:h$2({subdomain:"access",pathname:"liff/v1/authorize"}),profile:h$2({pathname:"v2/profile"}),message:h$2({pathname:"message/v3/share"}),messageOTT:h$2({pathname:"message/v3/multisend?type=ott"}),friendship:h$2({pathname:"friendship/v1/status"}),shareTargetPicker:h$2({subdomain:"access",pathname:"oauth2/v2.1/liff/shareTargetPicker"}),shareTargetPickerOtt:h$2({pathname:"liff/v2/apps"}),shareTargetPickerResult:h$2({subdomain:"access",pathname:"oauth2/v2.1/liff/shareTargetPicker/result"}),apps:h$2({pathname:"liff/v2/apps"}),subWindowGetMSIT:h$2({pathname:"liff/v2/sub/msit"}),subWindowGetMSTByMSIT:h$2({pathname:"liff/v2/sub/mst"}),subWindowSubscribe:h$2({subdomain:"liff",pathname:"liff/v2/sub/waitResult"}),subWindowPost:h$2({pathname:"liff/v2/sub/result"}),subWindowGetAppData:h$2({pathname:"liff/v2/sub/appData"}),subWindowGetOrigin:function(e){return h$2({pathname:"liff/v2/sub/"+e+"/origin"})},accessTokenVerify:h$2({pathname:"oauth2/v2.1/verify"}),unauthorizedPermissions:h$2({subdomain:"liff",pathname:"liff/v2/incrementalAgreement/unauthorizedPermissions"}),permanentLink:h$2({subdomain:"liff",pathname:"liff/v2/permanentLink"})};function l$1(e){return m$5[e]}function v$2(e){return c$4(l$1("accessTokenVerify")+"?access_token="+encodeURIComponent(e),{headers:{"Content-Type":"application/json",Accept:"application/json"}})}

    var o$1="liff.subwindow.identifier",c$3="liff.subwindow.cryptokey",d$2=__assign(__assign({},C$2),{GET_DATA:"getData",SET_DATA:"setData",NOT_FOUND:"notFound",TEARDOWN:"teardown"}),u$4={BROADCAST:"broadcast",COMMAND:"command"},f$4={MAIN:"main",SUB:"sub"},v$1=function(e){return __awaiter(void 0,void 0,void 0,(function(){var t;return __generator(this,(function(n){switch(n.label){case 0:return n.trys.push([0,2,,3]),[4,window.crypto.subtle.importKey("jwk",{kty:"oct",k:e,alg:"A128GCM",ext:!0},{name:"AES-GCM"},!1,["encrypt","decrypt"])];case 1:return [2,n.sent()];case 2:throw t=n.sent(),m$8(e$3,t);case 3:return [2]}}))}))},p$4=function(e,r,s){return __awaiter(void 0,void 0,void 0,(function(){var t,o,c,d;return __generator(this,(function(n){switch(n.label){case 0:return n.trys.push([0,3,,4]),t=(new TextEncoder).encode(e),[4,v$1(r)];case 1:return o=n.sent(),[4,window.crypto.subtle.encrypt({name:"AES-GCM",iv:t},o,(new TextEncoder).encode(s))];case 2:return c=n.sent(),[2,btoa(new Uint8Array(c).reduce((function(e,t){return e+String.fromCharCode(t)}),""))];case 3:throw d=n.sent(),m$8(e$3,d);case 4:return [2]}}))}))},m$4=function(e,r,s){return __awaiter(void 0,void 0,void 0,(function(){var t,o,c,d,u,f,l;return __generator(this,(function(n){switch(n.label){case 0:return n.trys.push([0,3,,4]),t=(new TextEncoder).encode(e),[4,v$1(r)];case 1:for(o=n.sent(),c=atob(s),d=new Uint8Array(c.length),u=0;u<c.length;u++)d[u]=c.charCodeAt(u);return [4,window.crypto.subtle.decrypt({name:"AES-GCM",iv:t},o,d.buffer)];case 2:return f=n.sent(),[2,(new TextDecoder).decode(new Uint8Array(f))];case 3:throw l=n.sent(),m$8(e$3,l);case 4:return [2]}}))}))},w=function(e,t){return y(e)===y(t)},y=function(e){return e.identifier+"-"+e.action+"-"+e.timestamp},g$3=function(e){return Object.keys(C$2).map((function(e){return C$2[e]})).includes(e)?u$4.BROADCAST:u$4.COMMAND};function b$1(){var e=document.createElement("form");e.method="POST",e.action="$MESSAGE_HANDLER_URL";var t=document.createElement("input");t.type="hidden",t.name="identifier",t.value="$IDENTIFIER",e.appendChild(t),document.body.appendChild(e),e.submit();}var E$2=function(s){var o=this;void 0===s&&(s=f$4.MAIN),this.identification={identifier:"",cryptoKey:""},this.messageHandlerInstance=null,this.listeners=new Map,this.sentMessages=[],this.generateIdentification=function(){return __awaiter(o,void 0,void 0,(function(){var e,s,o,d,u;return __generator(this,(function(l){switch(l.label){case 0:return e=new URLSearchParams(window.location.search),s=function(t){var n=e.get("liff.state");return n?new URLSearchParams(n).get(t):null},o=this,u={identifier:this.windowType===f$4.MAIN?U$1(12):e.get("liff.subwindow.identifier")||s("liff.subwindow.identifier")||""},this.windowType!==f$4.MAIN?[3,2]:[4,__awaiter(void 0,void 0,void 0,(function(){var e,t,r;return __generator(this,(function(n){switch(n.label){case 0:return n.trys.push([0,3,,4]),[4,window.crypto.subtle.generateKey({name:"AES-GCM",length:128},!0,["encrypt","decrypt"])];case 1:return e=n.sent(),[4,window.crypto.subtle.exportKey("jwk",e)];case 2:if(!(t=n.sent())||!t.k)throw m$8(e$3,"failed to generate key");return [2,t.k];case 3:throw r=n.sent(),m$8(e$3,r);case 4:return [2]}}))}))];case 1:return d=l.sent(),[3,3];case 2:d=e.get(c$3)||s(c$3)||"",l.label=3;case 3:return o.identification=(u.cryptoKey=d,u),[2]}}))}))},this.hasIdentification=function(){var e=o.identification,t=e.identifier,n=e.cryptoKey;return "string"==typeof t&&"string"==typeof n&&t.length>0&&n.length>0},this.isReady=function(){return o.hasIdentification()&&!!o.messageHandlerInstance},this.setup=function(){return __awaiter(o,void 0,void 0,(function(){var e,t,r,s,o,c=this;return __generator(this,(function(n){switch(n.label){case 0:return this.messageHandlerInstance?[2]:[4,this.generateIdentification()];case 1:if(n.sent(),!(e=this.identification.identifier))return [2];if(t=/^[a-zA-Z0-9]+$/gm,!e.match(t))throw m$8(e$3,"Invalid identifier");return (r=document.createElement("iframe")).style.display="none",r.src="about:blank",document.body.appendChild(r),null===(o=null==r?void 0:r.contentWindow)||void 0===o||o.window.eval("("+b$1.toString().replace("$MESSAGE_HANDLER_URL","https://liff-subwindow.line.me/liff/v2/sub/messageHandler").replace("$IDENTIFIER",e.split("'")[0])+")()"),s="iframe-"+e+"-ready",[4,new Promise((function(e){var t=function(n){n.data[s]&&(c.messageHandlerInstance=r,window.addEventListener("message",c.proxyToListeners),e(),document.removeEventListener("message",t));};window.addEventListener("message",t);}))];case 2:return [2,n.sent()]}}))}))},this.teardown=function(){return __awaiter(o,void 0,void 0,(function(){var e,t;return __generator(this,(function(n){switch(n.label){case 0:return this.isReady()?[4,this.send({eventName:d$2.TEARDOWN})]:[3,2];case 1:n.sent(),window.removeEventListener("message",this.proxyToListeners),this.listeners.clear(),null===(t=null===(e=this.messageHandlerInstance)||void 0===e?void 0:e.parentNode)||void 0===t||t.removeChild(this.messageHandlerInstance),this.messageHandlerInstance=null,n.label=2;case 2:return [2]}}))}))},this.listen=function(e){o.listeners.set(e,e);},this.listenRepliedEvent=function(e,t){var n=function(i){i.replyTarget&&w(i.replyTarget,e)&&(t(i),o.listeners.delete(n));};o.listeners.set(n,n);},this.send=function(e){return __awaiter(o,void 0,void 0,(function(){var t,r,s,a,o=this;return __generator(this,(function(n){switch(n.label){case 0:if(!this.isReady())throw m$8("message bus is not ready to send message");return r={action:g$3(e.eventName),identifier:this.identification.identifier||"",timestamp:(new Date).getTime()},[4,this.getEncryptedContext(e)];case 1:return r.context=n.sent(),t=r,null===(a=null===(s=this.messageHandlerInstance)||void 0===s?void 0:s.contentWindow)||void 0===a||a.postMessage({messageBusEvent:t},"*"),this.sentMessages.push(y(t)),[4,new Promise((function(e){o.listenRepliedEvent(t,(function(t){e(t.context);}));}))];case 2:return [2,n.sent()]}}))}))},this.reply=function(e,r){return __awaiter(o,void 0,void 0,(function(){var t,s,o,c;return __generator(this,(function(n){switch(n.label){case 0:if(!this.isReady())throw m$8("message bus is not ready to send message");if(!e.identifier||!e.timestamp)throw m$8(e$3,"target message is not valid");return s={action:u$4.BROADCAST},[4,this.getEncryptedContext(r)];case 1:return s.context=n.sent(),s.identifier=this.identification.identifier||"",s.timestamp=(new Date).getTime(),s.replyTarget={action:e.action,identifier:e.identifier,timestamp:e.timestamp},t=s,null===(c=null===(o=this.messageHandlerInstance)||void 0===o?void 0:o.contentWindow)||void 0===c||c.postMessage({messageBusEvent:t},"*"),this.sentMessages.push(y(t)),[2]}}))}))},this.setData=function(e,t){void 0===e&&(e="appData"),o.send({eventName:d$2.SET_DATA,key:e,data:t});},this.getData=function(e){return void 0===e&&(e="appData"),__awaiter(o,void 0,void 0,(function(){return __generator(this,(function(t){switch(t.label){case 0:return [4,this.send({eventName:d$2.GET_DATA,key:e})];case 1:return [2,t.sent()]}}))}))},this.proxyToListeners=function(i){return __awaiter(o,void 0,void 0,(function(){var r,s=this;return __generator(this,(function(a){return (r=i.data.messageBusEvent)?(this.sentMessages.includes(y(r))||r.identifier!==this.identification.identifier||r.action!==u$4.BROADCAST&&!r.replyTarget||this.listeners.forEach((function(i){return __awaiter(s,void 0,void 0,(function(){var t,s,a;return __generator(this,(function(n){switch(n.label){case 0:return t=i,s=[__assign({},r)],a={},[4,this.getDecryptedContext(r.context)];case 1:return t.apply(void 0,[__assign.apply(void 0,s.concat([(a.context=n.sent(),a)]))]),[2]}}))}))})),[2]):[2]}))}))},this.getEncryptedContext=function(e){return __awaiter(o,void 0,void 0,(function(){var t,i,r,s,a,o,c;return __generator(this,(function(n){switch(n.label){case 0:return t=this.identification,i=t.identifier,r=t.cryptoKey,a=(s=JSON).stringify,c={eventName:e.eventName,key:e.key?e.key:void 0},e.data?[4,p$4(i,r,JSON.stringify(e.data))]:[3,2];case 1:return o=n.sent(),[3,3];case 2:o=void 0,n.label=3;case 3:return [2,a.apply(s,[(c.data=o,c)])]}}))}))},this.getDecryptedContext=function(i){return __awaiter(o,void 0,void 0,(function(){var t,r,s,a,o,c,d,u;return __generator(this,(function(n){switch(n.label){case 0:return t=this.identification,r=t.identifier,s=t.cryptoKey,(a=JSON.parse(i)).data&&"string"==typeof a.data?(u=(d=JSON).parse,[4,m$4(r,s,a.data)]):[3,2];case 1:return c=u.apply(d,[n.sent()]),[3,3];case 2:c=void 0,n.label=3;case 3:return o=c,[2,__assign(__assign({},a),{data:o})]}}))}))},this.windowType=s;};

    function d$1(e){return new CustomEvent(l$8,{detail:e})}!function(){if("function"!=typeof window.CustomEvent){function t(t,e){var i=e||{},o=i.bubbles,n=void 0!==o&&o,a=i.cancelable,r=void 0!==a&&a,l=i.detail,d=void 0===l?void 0:l,f=document.createEvent("CustomEvent");return f.initCustomEvent(t,n,r,d),f}t.prototype=Event.prototype,window.CustomEvent=t;}}();var f$3={},c$2=!1;function s$5(e,i){c$2||(c$2=!0,window.addEventListener(l$8,(function(t){t&&t.detail&&t.detail.type&&f$3[t.detail.type]&&f$3[t.detail.type].forEach((function(e){return e(t)}));}))),f$3[e]?f$3[e].push(i):f$3[e]=[i];}function u$3(t,e){var i=f$3[t];if(i&&Array.isArray(i)){var o=i.indexOf(e);o>=0&&i.splice(o,1);}}function v(t){var i={};try{i=JSON.parse(t);}catch(r){throw m$8(i$5,r.message)}var a=d$1(i);r$1.debug("[client dispatchEvent to js]",{type:a.type,detail:a.detail}),window.dispatchEvent(a);}function p$3(t,a,l){void 0===a&&(a={}),void 0===l&&(l="");var d=K$1();if(!d)throw m$8(E$4,"Invalid featureToken for client features");if(!window._liff||!window._liff.postMessage)throw m$8(i$5,"postMessage is not available from client");r$1.debug("[js postMessage to client]",t,l,a),window._liff.postMessage(t,d,l,JSON.stringify(a));}function m$3(t,e,d){return void 0===e&&(e={}),void 0===d&&(d={once:!0}),K$1()?(d=__assign({callbackId:U$1(12),once:!0},d),new Promise((function(i,n){var a=function(e){if(e&&e.detail){var r=e.detail.callbackId===d.callbackId,l="string"!=typeof e.detail.callbackId;(r||l)&&(d.once&&u$3(t,a),r$1.debug("[callback detail]",e.detail),e.detail.error?n(e.detail.error):e.detail.data?i(e.detail.data):n(e.detail));}n();};s$5(t,a),p$3(t,e,d.callbackId);}))):Promise.reject(m$8(E$4,"Invalid featureToken for client features"))}

    var index_es$g = /*#__PURE__*/Object.freeze({
        __proto__: null,
        addListener: s$5,
        call: m$3,
        createEvent: d$1,
        dispatch: v,
        postMessage: p$3,
        removeListener: u$3
    });

    function e$1(){var e=n$4();null!==e&&("ios"===i$3()&&f$8(e,"9.19")>=0||"android"===i$3()&&f$8(e,"11.6.0")>=0)?location.href="liff://close":window._liff&&window._liff.postMessage?null!==e&&f$8(e,"10.15.0")>=0?"ios"===i$3()?window._liff.postMessage("closeWindow",""):window._liff.postMessage("closeWindow","","",""):m$3("closeWindow"):window.close();}

    var index_es$f = /*#__PURE__*/Object.freeze({
        __proto__: null,
        closeWindow: e$1
    });

    function x$1(e){var t=l$1("subWindowGetOrigin");return c$4(t(e))}var k$1={};function K(e,t){e&&k$1[e]&&k$1[e].forEach((function(e){e(t);}));}var G,V,F,_$1,q$1,z=function(){function n(e){this.storage=e;}return n.prototype.getItem=function(e){return this.storage.getItem(this.getKeyPrefix()+":"+e)},n.prototype.setItem=function(e,t){this.storage.setItem(this.getKeyPrefix()+":"+e,t);},n.prototype.removeItem=function(e){this.storage.removeItem(this.getKeyPrefix()+":"+e);},n.prototype.clear=function(){this.storage.clear();},n.prototype.getKeyPrefix=function(){return o$4+":"+this.getLiffId()},n.prototype.getLiffId=function(){var e=e$2().liffId;if(!e)throw m$8(T$3,"liffId is necessary for liff.init()");return e},n}(),H=new z(b$3);function Q(){var e=H.getItem("subWindowStatusUpdated");return null!==e&&JSON.parse(e)}function X(e){H.setItem("subWindowStatusUpdated",String(e));}function Y(e){G=e;}function Z(){return G}function $(){return F}function ee(){return _$1}function te(e){return void 0===e&&(e=f$4.MAIN),__awaiter(this,void 0,void 0,(function(){return __generator(this,(function(t){switch(t.label){case 0:return [4,(q$1=new E$2(e)).setup()];case 1:return t.sent(),[2,q$1]}}))}))}function ne(){return q$1}var re=new z(window.sessionStorage);function ie(e){re.setItem("mainWindowOrigin",e);}function se(){return re.getItem("mainWindowOrigin")}function oe(e,t){return void 0===t&&(t={}),__awaiter(this,void 0,void 0,(function(){var i,s,o,u,a,c,f,l;return __generator(this,(function(d){switch(d.label){case 0:if(null==(i=ne())?void 0:i.isReady())return [3,5];if(s=JSON.stringify(t),o=e$2().liffId,u=se(),!window.opener||!u||!o)throw m$8(N$1);a=!1,d.label=1;case 1:return d.trys.push([1,3,,4]),[4,x$1(o)];case 2:return c=d.sent(),a=c.subwindowCommonModule,[3,4];case 3:throw f=d.sent(),r$1.debug(f),m$8(N$1);case 4:return l=a?u:location.origin,[2,new Promise((function(t){window.addEventListener("message",(function n(i){(function(e){if(e.data&&"string"==typeof e.data.type&&[C$2.SUBMIT,C$2.CANCEL].includes(e.data.type))return !0;return !1})(i)&&(window.removeEventListener("message",n),t({status:e,result:s}));})),window.opener.postMessage({status:e,result:s},l);}))];case 5:return i.send({eventName:e,data:t}),[4,new Promise((function(e){setTimeout(e,500);}))];case 6:return d.sent(),[2,{status:e,result:JSON.stringify(t)}]}}))}))}function ue(e){var t,n=ee();if(e.origin===n){var i=e.data;if(i){var s,o=i.status,u=i.result;try{s=JSON.parse(u||"{}");}catch(a){s={};}switch(o){case p$8:window.clearInterval($()),le();break;case C$2.CANCEL:case C$2.SUBMIT:X(!0),window.clearInterval($()),window.removeEventListener("message",ue),K(o,s),null===(t=Z())||void 0===t||t.postMessage({type:o},ee());break;default:r$1.debug("unexpected message");}}}}var ae=function(e){return __awaiter(void 0,void 0,void 0,(function(){var t,n,i,s;return __generator(this,(function(o){if(Q())return [2];switch(t=e.context,n=t.eventName,i=t.data,s=ne(),n){case C$2.INIT:fe(!i.hasOpener);break;case C$2.CANCEL:case C$2.SUBMIT:X(!0),K(n,i),null==s||s.reply(e,{eventName:n});break;case C$2.CLOSE:!1===Q()&&(X(!0),K(C$2.CLOSE,{})),le();}return [2]}))}))};function ce(){window.clearInterval(V),window.clearInterval($()),window.removeEventListener("message",ue);}function fe(e){if(void 0===e&&(e=!1),ce(),X(!1),e){var t=Z();t&&(t.close(),Y(null));}}function le(){return __awaiter(this,void 0,void 0,(function(){var e;return __generator(this,(function(t){switch(t.label){case 0:return (e=ne())?[4,e.teardown()]:[3,2];case 1:t.sent(),t.label=2;case 2:return [2]}}))}))}function de(e){return __awaiter(this,void 0,void 0,(function(){var t,n,f,l,d,m,p,g,b,S;return __generator(this,(function(y){switch(y.label){case 0:return (t=k$3(e.url))?(fe(!0),[4,le()]):[2,Promise.reject(m$8(i$5,"params.url must be liff url"))];case 1:return y.sent(),n=e.url,f=e.appData,(l=new URL(n)).searchParams.append(L$2,"true"),[4,te()];case 2:return d=y.sent(),l.searchParams.append(o$1,d.identification.identifier),l.searchParams.append(c$3,d.identification.cryptoKey),l.hostname=function(e){var t=__read(e.split(".")),n=t[0],r=t.slice(1);return __spread([n+"-ext"],r).join(".")}(l.hostname),m=l.toString(),Y("ios"!==i$3()||$$1()?window.open("","liffsubwindow","width=480, height=640, menubar=no, toolbar=no, scrollbars=yes"):window.open()),[4,x$1(t)];case 3:if(p=y.sent(),g=p.origin,b=p.subwindowCommonModule,!(S=Z()))throw m$8(n$7);return b?(function(e){_$1=e;}(g),d.listen(ae),d.setData("appData",f),window.addEventListener("message",ue),S.location.href=m,O=function(e,t){var n=Z(),r={type:p$8};return t&&(r.message=JSON.stringify(t)),window.setInterval((function(){null==n||n.postMessage(r,e);}),S$3)}(g,f),F=O,function(e){V=e;}(window.setInterval((function(){var e=Z();e&&e.closed&&(ce(),Y(null),!1===Q()&&(X(!0),K(C$2.CLOSE,{})));}),m$9)),[2]):(S.close(),[2])}var O;}))}))}function me(e){return __awaiter(this,void 0,void 0,(function(){var t,n,i,s,o,u,c,l,d,m,p;return __generator(this,(function(h){switch(h.label){case 0:t=e.msit,n=e.mstChallenge,i=e.onSuccess,s=e.onError,o=e.reconnectCount,u=void 0===o?0:o,h.label=1;case 1:return h.trys.push([1,3,,6]),[4,p$5(l$1("subWindowSubscribe"),{method:"POST",body:JSON.stringify({msit:t,mstChallenge:n})})];case 2:return c=h.sent(),[3,6];case 3:return h.sent(),[4,ve()];case 4:return h.sent(),[4,he(me,{msit:t,mstChallenge:n,onSuccess:i,onError:s,reconnectCount:u+=1})];case 5:return h.sent(),[2];case 6:return c.status>=500?[4,ve()]:[3,9];case 7:return h.sent(),[4,he(me,{msit:t,mstChallenge:n,onSuccess:i,onError:s,reconnectCount:u+=1})];case 8:return h.sent(),[3,20];case 9:return c.status>=400&&500>c.status?[4,pe(c)]:[3,11];case 10:return (d=h.sent())?(l=d.errorDetail,s(m$8(i$5,l))):s(m$8(e$3,"Some error happened in the server")),[3,20];case 11:return 200!==c.status?[3,19]:[4,pe(c)];case 12:return (d=h.sent())?[3,13]:(s(m$8(e$3,"Some error happened in the server")),[3,18]);case 13:switch(m=d.status,p=d.result,m){case C$2.ERROR:return [3,14];case C$2.CLOSE:case C$2.CANCEL:case C$2.SUBMIT:return [3,16]}return [3,17];case 14:return [4,he(me,{msit:t,mstChallenge:n,onSuccess:i,onError:s,reconnectCount:u})];case 15:return h.sent(),[3,18];case 16:return i(m,p),[3,18];case 17:s(m$8(e$3,"Some error happened in the server")),h.label=18;case 18:return [3,20];case 19:s(m$8(e$3,"Some error happened in the server")),h.label=20;case 20:return [2]}}))}))}function ve(){return new Promise((function(e){return setTimeout(e,1e3)}))}function pe(e){return __awaiter(this,void 0,void 0,(function(){return __generator(this,(function(t){switch(t.label){case 0:return t.trys.push([0,2,,3]),[4,e.json()];case 1:return [2,t.sent()];case 2:return t.sent(),[2,null];case 3:return [2]}}))}))}function he(e,t){return __awaiter(this,void 0,void 0,(function(){return __generator(this,(function(n){switch(n.label){case 0:return t.reconnectCount>=10?(t.onError(m$8(e$3,"Failed to connect")),[3,3]):[3,1];case 1:return [4,e(t)];case 2:n.sent(),n.label=3;case 3:return [2]}}))}))}function we(e){var t={};return Object.keys(e).forEach((function(n){"closeButtonColor"===n?"white"===e[n]?t[n]="#ffffff":t[n]="#000000":t[n]=e[n];})),t}var ge={height:"full",closeButtonPosition:"right",closeButtonColor:"black",closeButtonLabel:""};function be(e){var t=e.appData,n=e.native,i=e$2().liffId,s=M(),o=k$3(e.url);if(!i)return Promise.reject(m$8(I$3,"liffId is invalid"));if(!s)return Promise.reject(m$8(I$3,"mst_challenge is invalid"));if(!o)return Promise.reject(m$8(i$5,"params.url must be liff url"));var u=Object.assign({},ge,n);return function(e){var t=e.mainLiffId,n=e.subLiffId,r=e.mstChallenge,i=e.appData,s=e.view;return t&&r?c$4(l$1("subWindowGetMSIT"),{method:"POST",body:JSON.stringify({mainLiffId:t,subLiffId:n,mstChallenge:r,appData:i,view:s})}):Promise.reject(m$8(i$5,"no proper argument"))}({mainLiffId:i,subLiffId:o,mstChallenge:s,appData:t,view:we(u)}).then((function(t){var n=t.msit;me({msit:n,mstChallenge:s,onSuccess:function(e,t){K(e,t);},onError:function(e){K(C$2.ERROR,e);}}),function(e,t){var n=e.url,r=new URLSearchParams;r.set("msit",t),location.href=A$3+"?url="+encodeURIComponent(n)+"&"+r.toString();}(e,n);}))}function Se$1(){if(!c$6())throw m$8(I$3,"this api can be only called in child window")}function ye$1(e){if(!e.mst||!e.status)return Promise.reject(m$8(i$5,"no proper argument"));var t=JSON.stringify(e);return c$4(l$1("subWindowPost"),{method:"POST",body:t})}function Ie$1(e){var t=e.msit,n=e.mstVerifier;return t&&n?c$4(l$1("subWindowGetMSTByMSIT"),{method:"POST",body:JSON.stringify({msit:t,mstVerifier:n})}):Promise.reject(m$8(i$5,"no proper argument"))}function Ce(e){var t=e.mst;return t?c$4(l$1("subWindowGetAppData"),{method:"POST",body:JSON.stringify({mst:t})}):Promise.reject(m$8(i$5,"no proper argument"))}var Oe$1={on:function(e,t){k$1[e]||(k$1[e]=[]),k$1[e].push(t);},off:function(e,t){if(k$1[e]){var n=k$1[e].indexOf(t);n>=0&&k$1[e].splice(n,1);}},open:function(e){if(!m$6("subwindowOpen"))throw m$8(E$4,"No permission for liff.subWindow.open()");return function(){if(c$6())throw m$8(I$3,"this api can be only called in parent window")}(),i$4()?be(e):de(e)},cancel:function(e){return void 0===e&&(e={}),Se$1(),i$4()?function(e){return void 0===e&&(e={}),__awaiter(this,void 0,void 0,(function(){var t,n;return __generator(this,(function(i){switch(i.label){case 0:return (t=g$4())?[4,ye$1({mst:t,status:C$2.CANCEL,result:e})]:[2,Promise.reject(m$8(I$3,"mst is invalid"))];case 1:return n=i.sent(),X(!0),[2,n]}}))}))}(e):function(e){return void 0===e&&(e={}),oe(C$2.CANCEL,e)}(e)},submit:function(e){return void 0===e&&(e={}),Se$1(),i$4()?function(e){return void 0===e&&(e={}),__awaiter(this,void 0,void 0,(function(){var t,n;return __generator(this,(function(i){switch(i.label){case 0:return (t=g$4())?[4,ye$1({mst:t,status:C$2.SUBMIT,result:e})]:[2,Promise.reject(m$8(I$3,"mst is invalid"))];case 1:return n=i.sent(),X(!0),[2,n]}}))}))}(e):function(e){return void 0===e&&(e={}),oe(C$2.SUBMIT,e)}(e)},close:function(){return Se$1(),i$4()?function(){return __awaiter(this,void 0,void 0,(function(){var e;return __generator(this,(function(t){switch(t.label){case 0:return !1!==Q()?[3,2]:(e=g$4())?[4,ye$1({mst:e,status:C$2.CLOSE,result:{}})]:[2,Promise.reject(m$8(I$3,"mst is invalid"))];case 1:t.sent(),t.label=2;case 2:return e$1(),[2]}}))}))}():function(){return __awaiter(this,void 0,void 0,(function(){var e;return __generator(this,(function(t){return (null==(e=ne())?void 0:e.isReady())?(e.send({eventName:C$2.CLOSE}),[2,new Promise((function(e){setTimeout((function(){e$1(),e();}),S$3);}))]):(e$1(),[2,Promise.resolve()])}))}))}()},getAppData:function(){return Se$1(),function(){var e,t=A$1();try{e=t?JSON.parse(t):{};}catch(n){e={};}return Promise.resolve(e)}()}};

    var index_es$e = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getAppData: Ce,
        getMSTByMSIT: Ie$1,
        getMainWindowOrigin: se,
        getMessageBus: ne,
        initMessageBus: te,
        setMainWindowOrigin: ie,
        subWindow: Oe$1
    });

    var i$1=function(){var r=this;this.type="sync",this.fns=new Set,this.on=function(n){r.fns.add(n);},this.call=function(){for(var e,i,s=[],a=0;a<arguments.length;a++)s[a]=arguments[a];try{for(var o=__values(r.fns),l=o.next();!l.done;l=o.next()){var c=l.value;c.apply(void 0,__spread(s));}}catch(f){e={error:f};}finally{try{l&&!l.done&&(i=o.return)&&i.call(o);}finally{if(e)throw e.error}}};},s$4=function(){var i=this;this.type="async",this.fns=new Set,this.on=function(n){i.fns.add(n);},this.call=function(){for(var s=[],a=0;a<arguments.length;a++)s[a]=arguments[a];return __awaiter(i,void 0,void 0,(function(){var r,i,a,o,l,c;return __generator(this,(function(e){switch(e.label){case 0:r=[];try{for(i=__values(this.fns),a=i.next();!a.done;a=i.next())o=a.value,r.push(o.apply(void 0,__spread(s)));}catch(f){l={error:f};}finally{try{a&&!a.done&&(c=i.return)&&c.call(i);}finally{if(l)throw l.error}}return [4,Promise.all(r)];case 1:return e.sent(),[2]}}))}))};};

    var ye={iconColor:"#111111",statusBarColor:"BLACK",titleTextColor:"#111111",titleSubtextColor:"#B7B7B7",titleButtonColor:"#111111",titleBackgroundColor:"#FFFFFF",progressBarColor:"#06C755",progressBackgroundColor:"#FFFFFF",titleButtonAreaBackgroundColor:"#1FFFFFFF",titleButtonAreaBorderColor:"#26000000",baseBackgroundColor:"#FFFFFF",baseTextColor:"#000000",lightButtonBorderColor:"rgba(0, 0, 0, 0.15)"},Ie={iconColor:"#FFFFFF",statusBarColor:"WHITE",titleTextColor:"#FFFFFF",titleSubtextColor:"#949494",titleButtonColor:"#FFFFFF",titleBackgroundColor:"#111111",progressBarColor:"#06C755",progressBackgroundColor:"#111111",titleButtonAreaBackgroundColor:"#1FFFFFFF",titleButtonAreaBorderColor:"#26000000",baseBackgroundColor:"#000000",baseTextColor:"#FFFFFF",lightButtonBorderColor:"rgba(255, 255, 255, 0.5)"};function Be(){var e;Te("color-scheme",((null==(e=T$1())?void 0:e.menuColorSetting)||{adaptableColorSchemes:["light"]}).adaptableColorSchemes.join(" "));var t=window.matchMedia("(prefers-color-scheme: dark)");Se({matches:null==t?void 0:t.matches,media:null==t?void 0:t.media}),t.addEventListener?t.addEventListener("change",Se):t.addListener&&t.addListener(Se);}function Se(t){var r=T$1(),n=(null==r?void 0:r.menuColorSetting)||{adaptableColorSchemes:["light"],lightModeColor:ye,darkModeColor:Ie},o=n.adaptableColorSchemes,i=n.lightModeColor,a=n.darkModeColor,s=o.includes("dark");t.matches&&s?xe(__assign(__assign({},Ie),a)):xe(__assign(__assign({},ye),i));}function xe(e){var t=e.iconColor,r=e.statusBarColor,n=e.titleTextColor,o=e.titleSubtextColor,i=e.titleButtonColor,l=e.titleBackgroundColor,c=e.progressBarColor,u=e.progressBackgroundColor,f=e.titleButtonAreaBackgroundColor,d=e.titleButtonAreaBorderColor,h=e.baseBackgroundColor,p=e.baseTextColor,v=e.lightButtonBorderColor;Te("--liff-base-background-color",h),Te("--liff-base-text-color",p),Te("--liff-base-background-rgb-color",d$4(h)),Te("--liff-base-text-rgb-color",d$4(p)),Te("--liff-light-button-border-color",v),Te("--liff-title-text-color",n),Te("--liff-title-background-color",l),Te("--liff-title-button-color",i),Te("--liff-icon-color",t),Te("--liff-status-bar-color",r),Te("--liff-title-subtext-color",o),Te("--liff-progress-bar-color",c),Te("--liff-progress-background-color",u),Te("--liff-title-button-area-background-color",l$7(f)),Te("--liff-title-button-area-border-color",l$7(d));}function Te(e,t){document.documentElement.style.setProperty(e,t);}function Ae(e){return __awaiter(this,void 0,void 0,(function(){return __generator(this,(function(t){switch(t.label){case 0:return [4,c$7()];case 1:return t.sent().install(e),[2]}}))}))}function Ee(){return __awaiter(this,void 0,void 0,(function(){return __generator(this,(function(e){switch(e.label){case 0:return [4,c$4(l$1("certs"))];case 1:return [2,e.sent()]}}))}))}function Le(e,n,o){return __awaiter(this,void 0,void 0,(function(){var t;return __generator(this,(function(r){switch(r.label){case 0:return [4,crypto.subtle.importKey("jwk",e,{name:"ECDSA",namedCurve:"P-256"},!1,["verify"])];case 1:return t=r.sent(),[4,crypto.subtle.verify({name:"ECDSA",hash:{name:"SHA-256"}},t,o,n)];case 2:return [2,r.sent()]}}))}))}function Ne(e,o){return __awaiter(this,void 0,void 0,(function(){var t,i,a,s,f,d,h,p,v,m,w,b,g,k,C,F;return __generator(this,(function(r){switch(r.label){case 0:return t=e.split("."),i=__read(t,3),a=i[0],s=i[1],f=i[2],d=JSON.parse(u$8.decode(a)),h=JSON.parse(u$8.decodeUnicode(s)),p=s$b(u$8.decode(f)),v=s$b(a+"."+s),[4,Ee()];case 1:if(m=r.sent(),!(w=m.keys.find((function(e){return e.kid===d.kid}))))return [3,6];if(delete w.alg,"ES256"!==d.alg)throw m$8(_$3,'Invalid "alg" value in ID_TOKEN');b=void 0,r.label=2;case 2:return r.trys.push([2,4,,5]),[4,Le(w,v,p)];case 3:return b=r.sent(),[3,5];case 4:throw g=r.sent(),m$8(_$3,"Failed to use Crypto API to verify ID_TOKEN: "+g);case 5:if(b){if(k="https://access.line.me"!==h.iss,C=h.aud!==o,F=1e3*h.exp<Date.now(),k)throw m$8(_$3,'Invalid "iss" value in ID_TOKEN');if(C)throw m$8(_$3,'Invalid "aud" value in ID_TOKEN');if(F)throw m$8(_$3,'Invalid "exp" value in ID_TOKEN');return [2,h]}throw m$8(_$3,"Invalid signature in ID_TOKEN");case 6:throw m$8(_$3,'Invalid "kid" value in ID_TOKEN');case 7:return [2]}}))}))}function Ue(e){var t=e.split(".");if(t[1])try{var r=t[1].replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(window.atob(r))}catch(n){return null}return null}function De(e){var t=e.pathname,r=e.query,n="liff://"+t+(r?"?"+A$2.stringify(r):"");location.href=n;}var Oe=null;function Pe(){"boolean"==typeof Oe&&r$1.warn("liff.init is not expected to be called more than once"),Oe=!!N()||!(!i$4()||A$2.parse(window.location.hash).feature_token||K$1())&&(O$1(!0),!0);}function We(){return Boolean(Oe)}function Ke(e,n){return __awaiter(this,void 0,void 0,(function(){var t;return __generator(this,(function(r){switch(r.label){case 0:return (t=g$4())?[2,t]:e&&n?[4,Ie$1({msit:e,mstVerifier:n})]:[3,2];case 1:return [2,r.sent().mst];case 2:return [2,null]}}))}))}function Me(e){return c$4(l$1("apps")+"/"+e+"/featureToken")}function Re(e){return __awaiter(this,void 0,void 0,(function(){var t,n,o,a;return __generator(this,(function(r){switch(r.label){case 0:return t=A$2.parse(window.location.hash),n=P$2({access_token:X$1(),context_token:F$1(),feature_token:K$1(),id_token:y$1(),client_id:R$1(),mst_challenge:M(),mst_verifier:C(),msit:d$3()},t),We()?o$3()?[4,Me(e)]:[3,2]:[3,3];case 1:o=r.sent().featureToken,n.feature_token||(n.feature_token=o),r.label=2;case 2:(a=w$2(e))&&(n.client_id=a),r.label=3;case 3:return [2,n]}}))}))}function je(e){if(e.persisted&&m$6("multipleLiffTransition"))if("ios"===i$3())window.location.reload();else {var t=e$2().liffId,r=K$1();if(!t)throw m$8(t$1,"Invalid LIFF ID.");if(!r)throw m$8(E$4,"Invalid featureToken for client features");De({pathname:"app/"+t,query:{feature_token:r}});}}function He(e,n){return __awaiter(this,void 0,void 0,(function(){var t,o;return __generator(this,(function(r){switch(r.label){case 0:return [4,v$2(e)];case 1:return t=r.sent().client_id,o=w$2(n),[2,t===o]}}))}))}function Je(e,n){return __awaiter(this,void 0,void 0,(function(){var t,o,a,s,c,u,d,h,p,m,w,b,g;return __generator(this,(function(r){switch(r.label){case 0:return [4,new Promise((function(e){var t=n$4();if(!t||f$8(t,"9.5.0")<0)e();else if(window._liff&&window._liff.features)e();else {r$1.debug("cannot find window._liff.features, listen to ready event");var r=function(){r$1.debug("ready event is fired"),u$3("ready",r),e();};s$5("ready",r);}}))];case 1:return r.sent(),Pe(),[4,Re(n.liffId)];case 2:if(t=r.sent(),o=t.access_token,a=t.context_token,s=t.feature_token,c=t.id_token,u=t.client_id,d=t.mst_verifier,h=t.mst_challenge,p=t.msit,a){if("string"!=typeof a)throw m$8(t$1,"Cannot get context token, perhaps there is an incorrect parameter in permanent link");S$1(Ue(a));}return !c$6()&&s&&(!function(e,t){m$6("multipleLiffTransition")&&De({pathname:"app/"+e,query:{feature_token:t}});}(n.liffId,s),We()&&h$3(s)),h&&p$6(h),d&&D(d),u&&v$3(u),p&&m$7(p),window.addEventListener("pageshow",je),o$3()?[3,7]:s&&o?[3,5]:We()?(m=O$2(location.href,{"liff.hback":"2"}),e.login({redirectUri:m}),[4,new Promise((function(){}))]):[3,4];case 3:r.sent(),r.label=4;case 4:throw e.login(),m$8(t$1,"Failed to parse feature_token or access_token");case 5:return [4,He(o,n.liffId)];case 6:if(!r.sent())throw e.login(),m$8(t$1,"Failed to verify access_token");h$3(s),G$1(o),r.label=7;case 7:return [4,Ke(p,d)];case 8:return (w=r.sent())?(L(w),[4,Ce({mst:w})]):[3,10];case 9:(b=r.sent().data)&&P$1(JSON.stringify(b)),r.label=10;case 10:return c&&!y$1()&&U(c),c&&u&&!b$2()?[4,Ne(c,u)]:[3,12];case 11:(g=r.sent())&&j$1(g),r.label=12;case 12:return [2]}}))}))}function Ve(e){return __awaiter(this,void 0,void 0,(function(){var t,n,o,i,a,s,c;return __generator(this,(function(r){switch(r.label){case 0:return t=l$1("apps"),n=t+"/"+e+"/contextToken",o=X$1(),i={"Content-Type":"application/json",Accept:"application/json"},o&&(i.Authorization="Bearer "+o),[4,c$4(n,{headers:i})];case 1:if(a=r.sent(),!(s=a.contextToken))throw m$8(t$1,"Can not get context from server.");if(!(c=Ue(s)))throw m$8(t$1,"Invalid context token.");return [2,c]}}))}))}function qe(){return __awaiter(this,void 0,void 0,(function(){var e,t;return __generator(this,(function(r){switch(r.label){case 0:if(!(e=e$2().liffId))throw m$8(t$1,"Invalid LIFF ID.");return [4,Ve(e)];case 1:return t=r.sent(),S$1(t),[2]}}))}))}function ze(e){return __awaiter(this,void 0,void 0,(function(){var n,o,i,a=this;return __generator(this,(function(s){switch(s.label){case 0:n=function(){return __awaiter(a,void 0,void 0,(function(){var t,n,o,i,a,s;return __generator(this,(function(r){switch(r.label){case 0:return [4,(l=e$2(),c=A$2.parse(window.location.search),u=B(),f={grant_type:"authorization_code",client_id:c.liffClientId,appId:l.liffId,code:c.code,code_verifier:u.codeVerifier,redirect_uri:l.redirectUri||c.liffRedirectUri,id_token_key_type:"JWK"},h=A$2.stringify(f),c$4(l$1("token"),{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:h}))];case 1:return t=r.sent(),n=t.access_token,o=t.id_token,i=t.expires_in,v$3(e),G$1(n),J(new Date(Date.now()+1e3*i)),H$1(),o?(U(o),[4,Ne(o,e)]):[3,3];case 2:(a=r.sent())&&j$1(a),r.label=3;case 3:return (s=A$2.parse(location.hash).context_token)?(S$1(Ue(s)),[3,6]):[3,4];case 4:return [4,qe()];case 5:r.sent(),r.label=6;case 6:return [2]}var l,c,u,f,h;}))}))},s.label=1;case 1:return s.trys.push([1,3,,4]),[4,n()];case 2:return s.sent(),[3,4];case 3:throw o=s.sent(),i=o,H$1(),i;case 4:return [2]}}))}))}function Ge(){return __awaiter(this,void 0,void 0,(function(){var e,n,o,a,s,l,c=this;return __generator(this,(function(u){switch(u.label){case 0:return (n=ne())?[3,2]:[4,te(f$4.SUB)];case 1:n=u.sent(),u.label=2;case 2:return (e=n).isReady()?(o=U$1(8),[4,e.getData("appData")]):[3,8];case 3:return a=u.sent(),s=a.eventName,l=a.data,s!==d$2.NOT_FOUND?[3,6]:[4,e.teardown()];case 4:return u.sent(),[4,Ge()];case 5:return [2,u.sent()];case 6:l&&P$1(JSON.stringify(l)),u.label=7;case 7:return e.listen((function(n){return __awaiter(c,void 0,void 0,(function(){var t,i;return __generator(this,(function(r){return t=n.context,i=t.data,t.eventName===C$2.INIT&&(null==i?void 0:i.subWindowId)!==o&&e$1(),t.eventName!==C$2.CANCEL&&t.eventName!==C$2.SUBMIT||e.teardown(),[2]}))}))})),o$3()&&e.send({eventName:C$2.INIT,data:{subWindowId:o,hasOpener:!!window.opener}}),[3,10];case 8:return se()?[3,10]:[4,new Promise((function(e){window.addEventListener("message",function(e){return function t(r){var n=r.data,o=r.source,i=r.origin;if(n){var a=n.type,s=n.message;a===p$8&&(window.removeEventListener("message",t),s&&P$1(s),ie(i),o&&o.postMessage&&o.postMessage({status:p$8},i),e());}}}(e));}))];case 9:return [2,u.sent()];case 10:return [2]}}))}))}var Qe=new(function(){function e(){var e=this;this.getAndValidateContext=function(){var e=T$1();if(!e)throw m$8(t$1,"Could not get Context from server.");if(!e.endpointUrl)throw m$8(t$1,"Could not get endpointUrl from server.");if(!e.permanentLinkPattern)throw m$8(t$1,"Could not get permanentLinkPattern from server.");return e},this.decodeState=function(t){var r=e.getAndValidateContext();t=t.replace(/\n/g,"%0D%0A");var n=!r.endpointUrl.startsWith("/?")&&r.endpointUrl.includes("/?")||!r.endpointUrl.startsWith("/#")&&r.endpointUrl.includes("/#")||r.endpointUrl.endsWith("/")||!t.startsWith("/?")&&t.includes("/?")||!t.startsWith("/#")&&t.includes("/#")||t.endsWith("/"),o=new URL(r.endpointUrl),i=o.origin,a=o.pathname,s=o.search,l=new URL(""+i+e.attachSlashAtStart(t)),c=l.pathname,u=l.search,f=l.hash,d=""+s+(s?u.replace(/\?/g,"&"):u),h=(""+a+e.attachSlashAtStart(c)).replace("//","/");return (h=e.attachSlashAtStart(""+h)).endsWith("/")&&!n&&(h=h.substring(0,h.length-1)),(""+i+h+d+f).replace(/%0D%0A/g,"\n")};}return e.prototype.attachSlashAtStart=function(e){return (e&&e.length>0&&!e.startsWith("/")?"/":"")+e},e.prototype.invoke=function(){return __awaiter(this,void 0,void 0,(function(){var e,t,n,o,i;return __generator(this,(function(r){switch(r.label){case 0:if(e=A$2.parse(window.location.search),"string"!=typeof(t=e["liff.state"]))return [2];r.label=1;case 1:return r.trys.push([1,4,,5]),n=location.href,(o=this.decodeState(t))===n?[3,3]:(e["liff.hback"]?location.replace(O$2(o,{"liff.hback":e["liff.hback"]})):location.replace(o),[4,new Promise((function(){}))]);case 2:r.sent(),r.label=3;case 3:return [3,5];case 4:if((i=r.sent()).code===t$1)throw i;return r$1.debug(i),[3,5];case 5:return [2]}}))}))},e}());function Xe(e,n,o){return __awaiter(this,void 0,void 0,(function(){var t;return __generator(this,(function(r){switch(r.label){case 0:if(!n.liffId)throw m$8(T$3,"liffId is necessary for liff.init()");return c$8(n),!i$4()&&o$3()&&(Q$1()||f$7()),t=A$2.parse(window.location.search),!c$6()||i$4()?[3,2]:[4,Ge()];case 1:r.sent(),r.label=2;case 2:if(t.error&&t.liffOAuth2Error)throw c=t.error,u=t.error_description,f=u.replace(/\+/g," "),m$8(t$1,c+": "+f);return a=t.code,s=B(),Boolean(a&&!o$3()&&s&&s.codeVerifier)?[4,ze(t.liffClientId)]:[3,4];case 3:r.sent(),r.label=4;case 4:return i$4()?[4,Je(e,n)]:[3,6];case 5:return r.sent(),[3,8];case 6:return o$3()?[3,8]:[4,qe()];case 7:r.sent(),r.label=8;case 8:return [4,Qe.invoke()];case 9:return r.sent(),[4,o()];case 10:return r.sent(),L$1(window.location.href),[2]}var a,s,c,u,f;}))}))}var Ye=function(e,t){return new Promise((function(r,n){if(e){var o=document.createElement("script");o.type="module",o.onload=function(){r();},o.src=e,document.head.appendChild(o);}else n(m$8(T$3,t));}))};function Ze(){return __awaiter(this,void 0,void 0,(function(){var e;return __generator(this,(function(t){switch(t.label){case 0:return i$4()||"android"!==i$3()||((e=A$2.parse(window.location.search))[o$1]||!(e.liffClientId&&""===document.referrer||document.referrer.includes("liffClientId"))||e.liffIsEscapedFromApp)?[3,4]:[4,Ye("https://static.line-scdn.net/lui/edge/versions/1.13.0/luivendor.js","LUI_VENDOR_URL is not defined")];case 1:return t.sent(),[4,Ye("https://static.line-scdn.net/lui/edge/versions/1.13.0/lui-alert.js","LUI_ALERT_URL is not defined")];case 2:return t.sent(),[4,(r=U$1(6),new Promise((function(){var e=document.createElement("div");e.innerHTML='<lui-alert id="liffAlert-'+r+'" shown title="Login successfully!" message="Continue to launch LIFF app!"></lui-alert>',document.body.appendChild(e);var t=document.getElementById("liffAlert-"+r);t&&t.addEventListener("lui-button-click",(function(){var e=window.open(window.location.href+"&liffIsEscapedFromApp=true","_blank");e&&(e.location.href=window.location.href+"&liffIsEscapedFromApp=true",window.close());}));})))];case 3:t.sent(),t.label=4;case 4:return [2]}var r;}))}))}var $e=function(){function e(){this.hooks={before:new s$4,after:new s$4},this.internalHooks={beforeFinished:new s$4,beforeSuccess:new s$4,error:new s$4};}return Object.defineProperty(e.prototype,"name",{get:function(){return "init"},enumerable:!1,configurable:!0}),e.prototype.install=function(e){var t=e.liff;return this.liff=t,this.init.bind(this)},e.prototype.init=function(e,n,a){return __awaiter(this,void 0,void 0,(function(){var t;return __generator(this,(function(r){switch(r.label){case 0:return [4,this.hooks.before.call()];case 1:r.sent(),s=this.liff,window&&!window.liff&&(window.liff=s),r.label=2;case 2:return r.trys.push([2,9,,11]),[4,Promise.all([Ae(this.liff),Xe(this.liff,e,this.internalHooks.beforeFinished.call)])];case 3:return r.sent(),Be(),[4,this.internalHooks.beforeSuccess.call()];case 4:return r.sent(),!e.withLoginOnExternalBrowser||o$3()?[3,6]:(this.liff.login(),[4,new Promise((function(){}))]);case 5:r.sent(),r.label=6;case 6:return [4,Ze()];case 7:return r.sent(),[4,this.hooks.after.call()];case 8:return r.sent(),"function"==typeof n&&n(),e$4(),[3,11];case 9:return t=r.sent(),[4,this.internalHooks.error.call(t)];case 10:throw r.sent(),"function"==typeof a&&a(t),t;case 11:return [2]}var s;}))}))},e}();

    var index_es$d = /*#__PURE__*/Object.freeze({
        __proto__: null,
        InitModule: $e
    });

    function n$3(){return "2.20.1"}

    var index_es$c = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getVersion: n$3
    });

    var tinySha256 = createCommonjsModule(function (module) {
    (function (global, factory) {
    	if (module.exports){
    		module.exports = factory();
    	} else {
    		global.sha256 = factory();
    	}
    })(commonjsGlobal, function () {

    var sha256 = function sha256(ascii) {
    	function rightRotate(value, amount) {
    		return (value>>>amount) | (value<<(32 - amount));
    	}	
    	var mathPow = Math.pow;
    	var maxWord = mathPow(2, 32);
    	var lengthProperty = 'length';
    	var i, j; // Used as a counter across the whole file
    	var result = '';

    	var words = [];
    	var asciiBitLength = ascii[lengthProperty]*8;
    	
    	//* caching results is optional - remove/add slash from front of this line to toggle
    	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
    	// (we actually calculate the first 64, but extra values are just ignored)
    	var hash = sha256.h = sha256.h || [];
    	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
    	var k = sha256.k = sha256.k || [];
    	var primeCounter = k[lengthProperty];
    	/*/
    	var hash = [], k = [];
    	var primeCounter = 0;
    	//*/

    	var isComposite = {};
    	for (var candidate = 2; primeCounter < 64; candidate++) {
    		if (!isComposite[candidate]) {
    			for (i = 0; i < 313; i += candidate) {
    				isComposite[i] = candidate;
    			}
    			hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
    			k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
    		}
    	}
    	
    	ascii += '\x80'; // Append '1' bit (plus zero padding)
    	while (ascii[lengthProperty]%64 - 56) ascii += '\x00'; // More zero padding
    	for (i = 0; i < ascii[lengthProperty]; i++) {
    		j = ascii.charCodeAt(i);
    		if (j>>8) return; // ASCII check: only accept characters in range 0-255
    		words[i>>2] |= j << ((3 - i)%4)*8;
    	}
    	words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
    	words[words[lengthProperty]] = (asciiBitLength);
    	
    	// process each chunk
    	for (j = 0; j < words[lengthProperty];) {
    		var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
    		var oldHash = hash;
    		// This is now the "working hash", often labelled as variables a...g
    		// (we have to truncate as well, otherwise extra entries at the end accumulate
    		hash = hash.slice(0, 8);
    		
    		for (i = 0; i < 64; i++) {
    			// Expand the message into 64 words
    			// Used below if 
    			var w15 = w[i - 15], w2 = w[i - 2];

    			// Iterate
    			var a = hash[0], e = hash[4];
    			var temp1 = hash[7]
    				+ (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
    				+ ((e&hash[5])^((~e)&hash[6])) // ch
    				+ k[i]
    				// Expand the message schedule if needed
    				+ (w[i] = (i < 16) ? w[i] : (
    						w[i - 16]
    						+ (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) // s0
    						+ w[i - 7]
    						+ (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)) // s1
    					)|0
    				);
    			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
    			var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
    				+ ((a&hash[1])^(a&hash[2])^(hash[1]&hash[2])); // maj
    			
    			hash = [(temp1 + temp2)|0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
    			hash[4] = (hash[4] + temp1)|0;
    		}
    		
    		for (i = 0; i < 8; i++) {
    			hash[i] = (hash[i] + oldHash[i])|0;
    		}
    	}
    	
    	for (i = 0; i < 8; i++) {
    		for (j = 3; j + 1; j--) {
    			var b = (hash[i]>>(j*8))&255;
    			result += ((b < 16) ? 0 : '') + b.toString(16);
    		}
    	}
    	return result;
    };


    sha256.code = "var sha256=function a(b){function c(a,b){return a>>>b|a<<32-b}for(var d,e,f=Math.pow,g=f(2,32),h=\"length\",i=\"\",j=[],k=8*b[h],l=a.h=a.h||[],m=a.k=a.k||[],n=m[h],o={},p=2;64>n;p++)if(!o[p]){for(d=0;313>d;d+=p)o[d]=p;l[n]=f(p,.5)*g|0,m[n++]=f(p,1/3)*g|0}for(b+=\"\\x80\";b[h]%64-56;)b+=\"\\x00\";for(d=0;d<b[h];d++){if(e=b.charCodeAt(d),e>>8)return;j[d>>2]|=e<<(3-d)%4*8}for(j[j[h]]=k/g|0,j[j[h]]=k,e=0;e<j[h];){var q=j.slice(e,e+=16),r=l;for(l=l.slice(0,8),d=0;64>d;d++){var s=q[d-15],t=q[d-2],u=l[0],v=l[4],w=l[7]+(c(v,6)^c(v,11)^c(v,25))+(v&l[5]^~v&l[6])+m[d]+(q[d]=16>d?q[d]:q[d-16]+(c(s,7)^c(s,18)^s>>>3)+q[d-7]+(c(t,17)^c(t,19)^t>>>10)|0),x=(c(u,2)^c(u,13)^c(u,22))+(u&l[1]^u&l[2]^l[1]&l[2]);l=[w+x|0].concat(l),l[4]=l[4]+w|0}for(d=0;8>d;d++)l[d]=l[d]+r[d]|0}for(d=0;8>d;d++)for(e=3;e+1;e--){var y=l[d]>>8*e&255;i+=(16>y?0:\"\")+y.toString(16)}return i};";

    return sha256;

    });
    });

    var g$2=function(){function g(){this.hooks={before:new i$1};}return Object.defineProperty(g.prototype,"name",{get:function(){return "login"},enumerable:!1,configurable:!0}),g.prototype.install=function(){return this.login.bind(this)},g.prototype.login=function(m){var g;this.hooks.before.call(m);var h=U$1(43),_=y$2(tinySha256(h)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,""),b=e$2();if(!b||!b.liffId)throw m$8(T$3,"You need to define `liffId` for liff.login()");var v={app_id:b.liffId,state:U$1(12),response_type:"code",code_challenge_method:"S256",code_challenge:_,liff_sdk_version:n$3()};m&&m.redirectUri&&(v.redirect_uri=m.redirectUri),c$6()&&!i$4()&&((null===(g=ne())||void 0===g?void 0:g.isReady())?v.redirect_uri=window.location.href:v.disable_auto_login="true"),x$2({codeVerifier:h});var w=l$1("authorize")+"?"+A$2.stringify(v);r$1.debug("[Redirect] "+w),window.location.href=w;},g}();

    var index_es$b = /*#__PURE__*/Object.freeze({
        __proto__: null,
        LoginModule: g$2
    });

    function n$2(){return navigator.language}

    var index_es$a = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getLanguage: n$2
    });

    function f$2(){return c$4(l$1("profile"))}

    var index_es$9 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getProfile: f$2
    });

    var p$2=function(i,n){return i?"&"+i.split("&").filter((function(i){return -1===i.indexOf("is_liff_external_open_window")})).join("&").concat(n?"#"+n:""):n?"#"+n:""};function d(d){if(!function(n){if(!n||"object"!=typeof n)return !1;var o=n,e=o.url,f=o.external,r=__read([typeof e,typeof f],2),t=r[0],l=r[1];return "string"===t&&""!==e&&("undefined"===l||"boolean"===l)}(d))throw m$8(i$5,"Invalid parameters for liff.openWindow()");var s=n$4();if(i$4())if(null!==s&&"ios"===i$3()&&f$8(s,"9.19")>=0||!window._liff.postMessage){var u=d.url,a=d.external,m=void 0!==a&&a;window.open(function(n,o){var e,f,r,t,l,d,s,u,a;return function(i){return -1!==i.indexOf("#")&&-1!==i.indexOf("?")&&i.indexOf("#")<i.indexOf("?")}(n)||function(i){return -1===i.indexOf("?")&&-1!==i.indexOf("#")}(n)?(s=(e=__read(n.split("#"),2))[0],f=e[1],u=(r=__read((void 0===f?"":f).split("?"),2))[0],a=r[1]):(s=(t=__read(n.split("?"),2))[0],l=t[1],a=(d=__read((void 0===l?"":l).split("#"),2))[0],u=d[1]),s+"?is_liff_external_open_window="+!!o+p$2(a,u)}(u,m));}else m$3("openWindow",d);else window.open(d.url,"_blank");}

    var index_es$8 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        openWindow: d
    });

    var s$3=function(r){return "object"==typeof r&&null!==r&&function(r){return "string"==typeof r||r instanceof String}(r.type)};function a$1(t){return Promise.reject(m$8(i$5,t))}function m$2(r){if(!function(r){return Array.isArray(r)&&r.every(s$3)}(r))return a$1("Parameter 'messages' must be an array of { type, ... }");var e=r.length;return e<1||e>5?a$1("Number of messages should be in range 1 to 5."):c$4(l$1("message"),{method:"POST",body:JSON.stringify({messages:r})}).catch(u$2)}var u$2=function(r){if("403"===r.code){var e="12.0.0"===n$4(),o="ios"===i$3(),n=$$1();e&&(o||n)&&window.alert("LINEアプリをLINE 12.0.1以降にアップデートしてください。\nPlease update your LINE app to LINE 12.0.1 or later.");}throw r};

    var index_es$7 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        alertToPromptUpdate: u$2,
        sendMessages: m$2
    });

    function e(){return c$4(l$1("friendship"))}

    var index_es$6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getFriendship: e
    });

    var n$1=function(t,e){this._driver=t,this.liff=e,this.hooks=this._driver.hooks,this.internalHooks=this._driver.internalHooks;},o=function(t,e){this._driver=t,this.liff=e,this.hooks=this._driver.hooks;},r=function(){function i(){this.modules=new Map,this.hooks={},this.internalHooks={};}return i.prototype.addModule=function(i,n){this.modules.set(i,n),n.hooks&&(this.hooks[i]=Object.entries(n.hooks).reduce((function(i,n){var o,r=__read(n,2),s=r[0],a=r[1];return __assign(__assign({},i),((o={})[s]=a.on.bind(a),o))}),{})),n.internalHooks&&(this.internalHooks[i]=Object.entries(n.internalHooks).reduce((function(i,n){var o,r=__read(n,2),s=r[0],a=r[1];return __assign(__assign({},i),((o={})[s]=a.on.bind(a),o))}),{}));},i.prototype.hasModule=function(t){return this.modules.has(t)},i}(),s$2=function(){function t(t,e,i){this.driver=t,this.context=e,this.option=i;}return t.prototype.install=function(){return this.factory(this.driver,this.context)},Object.defineProperty(t.prototype,"name",{get:function(){return "use"},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"defaultOption",{get:function(){return {namespacePrefix:"$"}},enumerable:!1,configurable:!0}),t.prototype.factory=function(t,e){var n=Object.assign({},this.defaultOption,this.option).namespacePrefix;return function(o,r){if(!o||"function"!=typeof o.install||"string"!=typeof o.name)return r$1.warn("To install the plugin, you need to define the `name` property and the `install` method."),this;var s=""+n+o.name;if(t.hasModule(s))return this;var a=o.install.call(o,e,r);return this[""+s]?(r$1.warn("There is a duplicate plugin name. `"+s+"` plugin namespace will be override."),this[""+s]=a):void 0!==a&&(this[""+s]=a),t.addModule(s,o),this}},t}();

    var index_es$5 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        LiffPluginContextImpl: o,
        ModuleContextImpl: n$1,
        ModuleDriverImpl: r,
        UseModule: s$2
    });

    function p$1(){return __awaiter(this,void 0,void 0,(function(){var t,i;return __generator(this,(function(e){switch(e.label){case 0:if(!o$3())return [3,6];e.label=1;case 1:return e.trys.push([1,5,,6]),(t=b$2())&&t.sub?[2,t.sub]:[3,2];case 2:return [4,f$2()];case 3:if((i=e.sent())&&i.userId)return [2,i.userId];e.label=4;case 4:return [3,6];case 5:return e.sent(),r$1.debug("can't retrieve Mid/Uid because of something wrong"),[3,6];case 6:return [2]}}))}))}function h$1(){return __awaiter(this,void 0,void 0,(function(){var t;return __generator(this,(function(e){switch(e.label){case 0:return [4,p$1()];case 1:return (t=e.sent())&&"u"===t.substring(0,1)?[2,t]:[2]}}))}))}var g$1=function(){function f(){this.utsExtra={isLiffSuccessful:!1,isLoggedIn:!1,id:"",version:""},this.injected=!1;}return Object.defineProperty(f,"CUSTOMPLACEID_INIT",{get:function(){return "liff.init"},enumerable:!1,configurable:!0}),Object.defineProperty(f,"CUSTOMTYPE",{get:function(){return "liffSdk"},enumerable:!1,configurable:!0}),Object.defineProperty(f,"GENERAL_UTS_ID",{get:function(){return "liff_general"},enumerable:!1,configurable:!0}),Object.defineProperty(f,"GENERAL_APP_NAME",{get:function(){return "LIFF General"},enumerable:!1,configurable:!0}),Object.defineProperty(f,"LiffUtsLoginStatus",{get:function(){return {isLoggedIn:1,isLiffSuccessful:2}},enumerable:!1,configurable:!0}),Object.defineProperty(f.prototype,"name",{get:function(){return "analytics"},enumerable:!1,configurable:!0}),f.prototype.install=function(t){var e=t.liff,i=t.internalHooks;this.liffCore=e,i.init.beforeFinished(this.beforeInitFinished.bind(this)),i.init.beforeSuccess(this.beforeInitSuccess.bind(this)),i.init.error(this.initError.bind(this));},f.prototype.changeRatioToUTSFormat=function(t){if(t&&Number.isFinite(t))return Math.round(100*t)},f.prototype.setExtra=function(){var t=this.utsExtra,e=t.isLiffSuccessful,i=t.isLoggedIn,s=t.id,r=t.version,n=(i?f.LiffUtsLoginStatus.isLoggedIn:0)|(e?f.LiffUtsLoginStatus.isLiffSuccessful:0);this.uts.setExtra("liff",{id:s,loginStatus:n,version:r});},f.prototype.assignUtsExtra=function(t){Object.assign(this.utsExtra,t);},f.prototype.setVersion=function(t){this.assignUtsExtra({version:t}),r$1.debug("[LIFFUTS][SDK version] "+t),this.setExtra();},f.prototype.setLiffId=function(t){this.assignUtsExtra({id:t}),r$1.debug("[LIFFUTS][LIFFID] "+t),this.setExtra();},f.prototype.setIsLoggedIn=function(t){this.assignUtsExtra({isLoggedIn:t}),r$1.debug("[LIFFUTS][isLoggedIn] "+t),this.setExtra();},f.prototype.sendLiffInit=function(){r$1.debug("[LIFFUTS][sendCustom] liff.init"),this.uts.sendCustom({type:f.CUSTOMTYPE,params:{placeId:f.CUSTOMPLACEID_INIT}});},f.prototype.setIsLiffSuccessful=function(t){this.assignUtsExtra({isLiffSuccessful:t}),r$1.debug("[LIFFUTS][isLiffInitSuccessful] "+t),this.setExtra();},f.prototype.prepareReferrer=function(t){var e={};Object.keys(t).forEach((function(i){if(c$a.includes(i)){var r=t[i];"string"==typeof r&&r&&(e[i.replace(/^liff\.ref\./,"")]=r);}})),Object.keys(e).length>0&&(this.referrer=e);},f.prototype.beforeInitFinished=function(){return __awaiter(this,void 0,void 0,(function(){var t,s,d,p,g,b,I,m,L,S,E,v,T;return __generator(this,(function(e){switch(e.label){case 0:if(t=A$2.parse(window.location.search),this.prepareReferrer(t),s=T$1(),!(d=null==s?void 0:s.utsTracking))return [2];if("auto"!==(p=d.mode)&&"force"!==p)return [3,6];r$1.debug("[LIFFUTS] "+(new Date).toUTCString()),g=e$2(),b=g.liffId,I=g.analytics,e.label=1;case 1:return e.trys.push([1,3,,4]),m=this,[4,new Promise((function(t,e){var i=window.uts,s=document.createElement("script");s.type="text/javascript",s.src="https://static.line-scdn.net/uts/edge/4.1.0/uts.js",s.onload=function(){var e=window.uts;t(e),window.uts=i;},s.onerror=function(t){e(t);},document.getElementsByTagName("head")[0].appendChild(s);}))];case 2:return m.uts=e.sent(),[3,4];case 3:return L=e.sent(),r$1.debug("[LIFFUTS] cannot load UTS, reason: "+L),[2];case 4:return S=void 0,E=void 0,"force"===p?(S={utsId:f.GENERAL_UTS_ID,appName:f.GENERAL_APP_NAME,appEnv:"release"},E={endpoint:"https://uts-front.line-apps.com",sampleRate:this.changeRatioToUTSFormat(d.sendRatio),version:"current"}):(S=__assign(__assign({},null==I?void 0:I.context),{utsId:(null==I?void 0:I.context.utsId)||f.GENERAL_UTS_ID,appName:(null==I?void 0:I.context.appName)||f.GENERAL_APP_NAME,appEnv:(null==I?void 0:I.context.appEnv)||"release"}),E=__assign(__assign({endpoint:"https://uts-front.line-apps.com"},null==I?void 0:I.options),{sampleRate:this.changeRatioToUTSFormat(d.sendRatio),version:"current"})),this.uts.init(S,E),[4,h$1()];case 5:(v=e.sent())&&(r$1.debug("[LIFFUTS][mid] "+v),this.uts.setMid(v)),(null==s?void 0:s.tid)&&(r$1.debug("[LIFFUTS][tid] "+s.tid),this.uts.setTid(s.tid)),this.referrer&&(r$1.debug("liff.ref.referrer",this.referrer),this.uts.setSessionParams(this.referrer)),b&&this.setLiffId(b),this.setIsLoggedIn(o$3()),this.setVersion(n$3()),T=x$3(location.href),r$1.debug("[LIFFUTS][url] "+T),this.uts.setUrl(T),this.liffCore.analytics=this.uts,this.injected=!0,e.label=6;case 6:return [2]}}))}))},f.prototype.beforeInitSuccess=function(){return this.injected&&(this.setIsLiffSuccessful(!0),this.sendLiffInit()),Promise.resolve()},f.prototype.initError=function(){return this.injected&&(this.setIsLiffSuccessful(!1),this.sendLiffInit()),Promise.resolve()},f}(),b=function(t){r$1.debug("[LIFFUTS][sendCustom] liff.shareTargetPicker"),t.sendCustom({type:"liffSdk",params:{placeId:"liff.shareTargetPicker"}});};

    var index_es$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        AnalyticsModule: g$1,
        sendShareTargetPicker: b
    });

    function h(n){return __awaiter(this,void 0,void 0,(function(){var t,i;return __generator(this,(function(r){switch(r.label){case 0:return [4,fetch(l$1("permanentLink"),{headers:{"Content-Type":"application/json",Accept:"application/json"},method:"POST",body:JSON.stringify(n)})];case 1:return (t=r.sent()).ok?[3,3]:[4,t.json()];case 2:throw i=r.sent().message,m$8(e$3,i);case 3:return [4,t.json()];case 4:return [2,r.sent()]}}))}))}var p=function(){function e(){var e=this;this.extraParams="",this.getAndValidateContext=function(){var t=T$1();if(!t)throw m$8(t$1,"Could not get Context from server.");if(!t.endpointUrl)throw m$8(t$1,"Could not get endpointUrl from server.");if(!t.permanentLinkPattern)throw m$8(t$1,"Could not get permanentLinkPattern from server.");return t},this.createUrl=function(){var t=e.getAndValidateContext(),r=window.location,n=r.pathname,s=r.search,u=r.hash,c=r.origin,h=new URL(t.endpointUrl);if(h.origin!==c||!e.isAncestor(h.pathname,n))throw m$8(T$3,"Current page is not under entrypoint.");var p=n.substring(h.pathname.length);p.length>0&&"/"!==p[0]&&(p="/"+p);var m=new RegExp("^"+O$3.join("|")),d=u.substring(1).split("&").filter((function(t){return !m.test(t)&&Boolean(t)})).join("&"),g=d===h.hash.substring(1)?"":d,v=function(t){return t.substring(1).split("&").filter((function(t){return !/liff\.state/.test(t)&&Boolean(t)}))},w=v(s),x=v(h.search);e.extraParams&&w.push(e.extraParams);for(var U=0;U<x.length;U++){var y=x[U],b=w.indexOf(y);b>-1&&w.splice(b,1);}var P=w.join("&"),j=p+(""!==P?"?"+P:"")+(g?"#"+g:"");return ""+s$c+e$2().liffId+j},this.createUrlBy=function(i){return __awaiter(e,void 0,void 0,(function(){var t,e;return __generator(this,(function(r){switch(r.label){case 0:if(!(t=e$2().liffId))throw m$8(t$1,"Should run after liff init.");try{e=new URL(i);}catch(o){throw m$8(i$5,"invalid URL.")}return [4,h({liffId:t,currentPageUrl:e.toString()})];case 1:return [2,r.sent().permanentLinkUrl]}}))}))},this.setExtraQueryParam=function(t){e.extraParams=t;},this.isAncestor=function(t,r){return 0===r.indexOf(t)&&(t.endsWith("/")&&(t=t.substring(0,t.length-1)),void 0===r[t.length]||"/"===r[t.length])},this.install=function(){return {createUrl:e.createUrl,createUrlBy:e.createUrlBy,setExtraQueryParam:e.setExtraQueryParam}};}return Object.defineProperty(e.prototype,"name",{get:function(){return "permanentLink"},enumerable:!1,configurable:!0}),e}(),m$1=new p;

    var index_es$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        PermanentLink: p,
        module: m$1
    });

    var s$1,f$1=function(){function o(o,t){var n=this;this.resolve=o,this.reject=t,this.onSubmit=function(o){var t=o.message;n.resolve({value:t}),n.destroy();},this.onClose=function(){n.resolve({value:null}),n.destroy();},this.onCancel=function(){n.resolve({value:null}),n.destroy();},this.onError=function(o){n.reject(o),n.destroy();},this.start();}return o.prototype.start=function(){Oe$1.on("submit",this.onSubmit),Oe$1.on("close",this.onClose),Oe$1.on("cancel",this.onCancel),Oe$1.on("error",this.onError);},o.prototype.destroy=function(){Oe$1.off("submit",this.onSubmit),Oe$1.off("close",this.onClose),Oe$1.off("cancel",this.onCancel),Oe$1.off("error",this.onError),s$1=void 0;},o}();function u$1(){return __awaiter(this,void 0,void 0,(function(){return __generator(this,(function(o){if(!m$6("subwindowOpen")||!m$6("scanCodeV2"))throw m$8(E$4,"No permission for liff.scanCodeV2()");return s$1&&s$1.destroy(),[2,new Promise((function(o,t){s$1=new f$1(o,t),Oe$1.open({url:"https://liff.line.me/1656359117-jxmx5e11"}).catch((function(o){null==s$1||s$1.destroy(),t(o);}));}))]}))}))}var l=function(){function o(){}return Object.defineProperty(o.prototype,"name",{get:function(){return "scanCodeV2"},enumerable:!1,configurable:!0}),o.prototype.install=function(){return u$1},o}(),c$1=new l;

    var index_es$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ScanCodeV2Module: l,
        module: c$1
    });

    function g(r){return __awaiter(this,void 0,void 0,(function(){var e,a,u,f,p,d,m;return __generator(this,(function(t){switch(t.label){case 0:return function(e){if(!F$3.includes(e))throw m$8(i$5,"Unexpected permission name.");var t=T$1();return !!(null==t?void 0:t.scope.includes(e))}(r)?(e=X$1())?[4,v$2(e)]:[3,2]:[2,{state:"unavailable"}];case 1:a=t.sent(),u=unescape(a.scope).split(" ");try{for(f=__values(u),p=f.next();!p.done;p=f.next())if(p.value.includes(r))return [2,{state:"granted"}]}catch(w){d={error:w};}finally{try{p&&!p.done&&(m=f.return)&&m.call(f);}finally{if(d)throw d.error}}return [2,{state:"prompt"}];case 2:throw m$8(I$3,"LiffId is not found.")}}))}))}function I(){var e,t,n=T$1();return !!n&&("square_chat"!==n.type&&(m$6("skipChannelVerificationScreen")||!i$4()&&(null===(t=null===(e=n.availability)||void 0===e?void 0:e.skipChannelVerificationScreen)||void 0===t?void 0:t.permission)))}function k(){var e=e$2().liffId;if(e)return c$4(l$1("unauthorizedPermissions")+"?liffId="+e,{headers:{"Content-Type":"application/json",Accept:"application/json",Authorization:"Bearer "+X$1()}});throw m$8(I$3,"liffId is required")}var j,A=Oe$1.on,S=Oe$1.off,T=Oe$1.open,q=function(){function n(n,r){var i=this;this.onSubmit=function(n){var r=n.newAccessToken,o=n.ICA_ERROR;return __awaiter(i,void 0,void 0,(function(){return __generator(this,(function(e){return r?this.resolve({newAccessToken:r}):o&&this.reject(m$8(e$3,o)),this.teardown(),[2]}))}))},this.onClose=function(){return __awaiter(i,void 0,void 0,(function(){return __generator(this,(function(e){return this.reject(m$8(I$3,"user didn't allow the agreement")),this.teardown(),[2]}))}))},this.onCancel=function(){return __awaiter(i,void 0,void 0,(function(){return __generator(this,(function(e){return this.reject(m$8(I$3,"user didn't allow the agreement")),this.teardown(),[2]}))}))},this.onError=function(n){return __awaiter(i,void 0,void 0,(function(){return __generator(this,(function(e){return this.reject(n),this.teardown(),[2]}))}))},this.resolve=n,this.reject=r,this.setup();}return n.prototype.setup=function(){A("submit",this.onSubmit),A("close",this.onClose),A("cancel",this.onCancel),A("error",this.onError);},n.prototype.teardown=function(){S("submit",this.onSubmit),S("close",this.onClose),S("cancel",this.onCancel),S("error",this.onError),j=void 0;},n.prototype.open=function(){var e=e$2().liffId;e?T({url:"https://liff.line.me/1656032314-Xgrw5Pmk",appData:{liffId:e,channelId:w$2(e),accessToken:X$1()}}):this.reject(m$8(I$3,"liffId is required"));},n}();function x(){return __awaiter(this,void 0,void 0,(function(){var e,n;return __generator(this,(function(t){switch(t.label){case 0:if(!I())throw m$8(E$4,"SkipChannelVerificationScreen is unavailable.");return j&&j.teardown(),[4,k()];case 1:return e=t.sent(),(i$4()?e:e.filter((function(e){return "chat_message.write"!==e}))).length>0?[4,new Promise((function(e,t){(j=new q(e,t)).open();}))]:[3,3];case 2:return n=t.sent().newAccessToken,G$1(n),[3,4];case 3:throw m$8(E$4,"All permissions have already been approved.");case 4:return [2]}}))}))}function E$1(n,i){var o=this;return function(){for(var s=[],u=0;u<arguments.length;u++)s[u]=arguments[u];return __awaiter(o,void 0,void 0,(function(){var e,o,u;return __generator(this,(function(t){switch(t.label){case 0:return e=(s.length>0?s[s.length-1]:{}).ignorePermissionCheck,o=void 0!==e&&e,[4,g(i)];case 1:if("unavailable"!==(u=t.sent().state))return [3,2];throw m$8(E$4,"The permission is not in LIFF app scope.");case 2:return "prompt"!==u||!I()||o||!i$4()&&"chat_message.write"===i?[3,4]:[4,x()];case 3:return t.sent(),[3,5];case 4:o&&s.pop(),t.label=5;case 5:return [4,n.apply(void 0,__spread(s))];case 6:return [2,t.sent()]}}))}))}}var P=function(){function e(){this.name="permission";}return e.prototype.install=function(){return {query:g,requestAll:x}},e}(),_=new P;

    var index_es$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        PermissionModule: P,
        attachChecker: E$1,
        module: _
    });

    var n={};function i(){return n}function s(e,r){var o=i(),n=__read(r.split("."),1)[0],s=o[r];s&&e.removeEventListener(n,s),o[r]=null;}var f=!1,a=!1;function c(e,r,o,i){f||(a=function(){var t=!1;try{var e=Object.defineProperty({},"passive",{get:function(){return t=!0,!1}});window.addEventListener("test",e,e),window.removeEventListener("test",e,e);}catch(r){t=!1;}return t}(),f=!0);var c=__read(r.split("."),1)[0];return new Promise((function(t){var f=function(n){t(n),o&&o(n),i&&i.once&&s(e,r);};!function(t,e){n[t]=e;}(r,f),e.addEventListener(c,f,!!a&&i);}))}function u(t,o,n,i){if(void 0===n&&(n={}),"object"!=typeof t||!t.postMessage)throw m$8(i$5,"target must be window object");if("string"!=typeof o)throw m$8(i$5,"keyname must be string");if("object"!=typeof n)throw m$8(i$5,"incorrect body format. It should be Object or Array comprised of Object");if(!i)throw m$8(i$5,"serverEndPointUrl isn't passed. please fill up with proper url");if("*"===i)throw new Error("serverEndPointUrl doesn't allow to set '*'");var s={name:o,body:n};t.postMessage(s,i);}function m(t,e,r,n){c(t,"message."+e,function(t,e,r){return function(n){r$1.debug("messageReceive",n),n.origin===r&&n.data.name===t&&e(n);}}(e,r,n));}

    var E=function(){function r(){this.payloadToShareTargetPicker=null,this.popupWindow=null,this.doesWaitForSubwindowResult=!1;}return r.getInstance=function(){return r.instance?r.instance.reset():r.instance=new r,r.instance},r.prototype.init=function(i){return __awaiter(this,void 0,void 0,(function(){var t,r;return __generator(this,(function(e){switch(e.label){case 0:return e.trys.push([0,5,,6]),this.liffId=i.referrer.liffId,this.doesWaitForSubwindowResult=!(!i.options||!i.options.waitForSubwindowResult),this.allowPostMessageOrigin=this.initAllowPostMessageOrigin(),this.payloadToShareTargetPicker=this.buildPayloadToShareTargetPicker(i),window.AbortController&&(this.abortController=new window.AbortController),this.prepareAnotherWindow(),[4,this.initOtt()];case 1:return e.sent(),this.initListener(),this.openAnotherWindow(),this.doesWaitForSubwindowResult?[4,this.pollingShareResult()]:[3,3];case 2:return t=e.sent(),this.finalize(),[2,t];case 3:return [2];case 4:return [3,6];case 5:if(r=e.sent(),this.finalize(),"AbortError"!==r.name)throw r;return [3,6];case 6:return [2]}}))}))},r.prototype.resetAllVariables=function(){this.liffId="",this.allowPostMessageOrigin="",this.payloadToShareTargetPicker=null,this.ott="",this.popupWindow=null,this.timeoutIDForHealthCheck=null,this.abortController=null,this.internalError=null,this.doesWaitForSubwindowResult=!1;},r.prototype.reset=function(){this.finalize(),this.resetAllVariables();},r.prototype.finalize=function(){var t,e;this.abortController&&this.abortController.abort(),i$4()||(t=this.timeoutIDForHealthCheck,e=this.popupWindow,s(window,"message.receivedHealthcheck"),t&&clearTimeout(t),e&&!e.closed&&e.close());},r.prototype.buildPayloadToShareTargetPicker=function(t){return {messages:t.messages,isMultiple:t.isMultiple,referrer:t.referrer}},r.prototype.initAllowPostMessageOrigin=function(t){return void 0===t&&(t=l$1("shareTargetPicker")),S$2(t)},r.prototype.initOtt=function(){return __awaiter(this,void 0,void 0,(function(){var t,i,r;return __generator(this,(function(e){switch(e.label){case 0:return this.abortController&&(t=this.abortController.signal),i=l$1("shareTargetPickerOtt")+"/"+this.liffId+"/ott",r=this,[4,c$4(i,{method:"GET",signal:t}).then((function(t){return t.ott}))];case 1:return r.ott=e.sent(),[2]}}))}))},r.prototype.prepareAnotherWindow=function(){i$4()||("ios"!==i$3()||$$1()?this.popupWindow=window.open("","liffpopup","width=480, height=640, menubar=no, toolbar=no, scrollbars=yes"):this.popupWindow=window.open());},r.prototype.openAnotherWindow=function(){if(i$4()&&this.payloadToShareTargetPicker)t=this.liffId,e=this.ott,r=this.payloadToShareTargetPicker,o={liffId:t,ott:e,data:JSON.stringify(r),closeModals:!1},location.href="line://picker?"+A$2.stringify(o);else {if(this.timeoutIDForHealthCheck=window.setTimeout(this.healthCheck.bind(this),1e3),!this.popupWindow)throw m$8(n$7);!function(t,e,i){var r={liffId:e,ott:i};t.location.href=l$1("shareTargetPicker")+"?"+A$2.stringify(r);}(this.popupWindow,this.liffId,this.ott);}var t,e,r,o;},r.prototype.initListener=function(){var t,e;i$4()||(t=this.onReceivedHealthcheck.bind(this),e=this.allowPostMessageOrigin,m(window,"receivedHealthcheck",t,e));},r.prototype.healthCheck=function(){return __awaiter(this,void 0,void 0,(function(){var t;return __generator(this,(function(e){switch(e.label){case 0:if(this.popupWindow&&!this.popupWindow.closed)return [3,7];if(!this.doesWaitForSubwindowResult)return [3,5];e.label=1;case 1:return e.trys.push([1,3,,4]),[4,this.onCanceled()];case 2:return e.sent(),[3,4];case 3:return t=e.sent(),this.internalError=t,[3,4];case 4:return [3,6];case 5:this.finalize(),e.label=6;case 6:return [3,8];case 7:i=this.popupWindow,r=this.allowPostMessageOrigin,u(i,"healthcheck",void 0,r),this.timeoutIDForHealthCheck=window.setTimeout(this.healthCheck.bind(this),1e3),e.label=8;case 8:return [2]}var i,r;}))}))},r.prototype.onReceivedHealthcheck=function(){if(!this.popupWindow||!this.payloadToShareTargetPicker)throw m$8(n$7);var t,e,r;t=this.popupWindow,e=this.payloadToShareTargetPicker,r=this.allowPostMessageOrigin,u(t,"ready",e,r);},r.prototype.onCanceled=function(){return __awaiter(this,void 0,void 0,(function(){var t,i;return __generator(this,(function(e){switch(e.label){case 0:if(i$4()||!this.ott)throw new Error("need to call with ott in client");return this.abortController&&(t=this.abortController.signal),i={liffId:this.liffId,ott:this.ott},[4,c$4(l$1("shareTargetPickerResult")+"?"+A$2.stringify(i),{method:"POST",signal:t,headers:{Accept:"application/json","Content-Type":"application/x-www-form-urlencoded"},body:"result=CANCEL"})];case 1:return [2,"ok"===e.sent().status]}}))}))},r.prototype.getShareResult=function(){return __awaiter(this,void 0,void 0,(function(){var t,i;return __generator(this,(function(e){if(!this.ott)throw new Error("need to call with ott in client");return this.abortController&&(t=this.abortController.signal),i={liffId:this.liffId,ott:this.ott},r$1.debug("fetch: getShareResult"),[2,c$4(l$1("shareTargetPickerResult")+"?"+A$2.stringify(i),{method:"GET",headers:{Accept:"application/json"},signal:t})]}))}))},r.isPollingTimeOut=function(t,e){return (e-t)/6e4>=10},r.prototype.pollingShareResult=function(){return __awaiter(this,void 0,void 0,(function(){var t,i;return __generator(this,(function(e){switch(e.label){case 0:t=Date.now(),e.label=1;case 1:if(r.isPollingTimeOut(t,Date.now()))return [3,4];if(this.internalError)throw this.internalError;return [4,this.getShareResult()];case 2:if((i=e.sent())&&i.result)switch(i.result){case"SUCCESS":return [2,{status:"success"}];case"CANCEL":return [2];case"FAILURE":default:throw new Error(i.resultDescription)}return [4,new Promise((function(t){setTimeout(t,500);}))];case 3:return e.sent(),[3,1];case 4:throw new Error("Timeout: not finished within 10min")}}))}))},r}(),R=function(){function i(){var i=this;this.name="shareTargetPicker",this.shareTargetPicker=function(l,h){return void 0===h&&(h={}),__awaiter(i,void 0,void 0,(function(){var t,i,u,c,g,y,k;return __generator(this,(function(e){switch(e.label){case 0:if(t=void 0===h.isMultiple||h.isMultiple,this.checkPermission(),!o$3())throw m$8(I$3,"Need access_token for api call, Please login first");if(!l||!Array.isArray(l)||0===l.length)throw m$8(i$5,"no proper argument");if(l.length>a$5)throw m$8(i$5,"exceed the limit of num of messages");if(!(i=e$2().liffId))throw m$8(T$3);window.liff&&(u=window.liff).analytics&&b(u.analytics),e.label=1;case 1:return e.trys.push([1,3,,4]),c=E.getInstance(),g=n$4(),y={waitForSubwindowResult:!0},i$4()&&g&&f$8(g,"10.11.0")<0&&(y.waitForSubwindowResult=!1),[4,c.init({messages:l,isMultiple:t,referrer:{liffId:i,url:location.origin},options:y})];case 2:return [2,e.sent()];case 3:throw (k=e.sent())instanceof h$4?k:m$8(N$1,k.message);case 4:return [2]}}))}))},this.checkPermission=function(){if(c$6())throw m$8(E$4,"The operation is not allowed in the SubWindow");var t=((T$1()||{}).availability||{}).shareTargetPicker||{},e=t.permission,i=t.minVer;if(!e)throw i$4()?m$8(E$4,"Need LINE App "+i+" at least or consent on shareTargetPicker usage on LINE developer site"):m$8(E$4,"Need consent on shareTargetPicker usage on LINE developer site")};}return i.prototype.install=function(){return this.shareTargetPicker},i}(),O=new R;

    var index_es = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ShareTargetPickerModule: R,
        module: O
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(fetch$2);

    var require$$1 = /*@__PURE__*/getAugmentedNamespace(polyfill);

    var require$$2 = /*@__PURE__*/getAugmentedNamespace(index_es$d);

    var require$$3 = /*@__PURE__*/getAugmentedNamespace(index_es$b);

    var require$$4 = /*@__PURE__*/getAugmentedNamespace(index_es$n);

    var require$$5 = /*@__PURE__*/getAugmentedNamespace(index_es$o);

    var require$$6 = /*@__PURE__*/getAugmentedNamespace(index_es$p);

    var require$$7 = /*@__PURE__*/getAugmentedNamespace(index_es$l);

    var require$$8 = /*@__PURE__*/getAugmentedNamespace(index_es$c);

    var require$$9 = /*@__PURE__*/getAugmentedNamespace(index_es$a);

    var require$$10 = /*@__PURE__*/getAugmentedNamespace(index_es$9);

    var require$$11 = /*@__PURE__*/getAugmentedNamespace(index_es$m);

    var require$$12 = /*@__PURE__*/getAugmentedNamespace(index_es$j);

    var require$$13 = /*@__PURE__*/getAugmentedNamespace(index_es$g);

    var require$$14 = /*@__PURE__*/getAugmentedNamespace(index_es$k);

    var require$$15 = /*@__PURE__*/getAugmentedNamespace(index_es$h);

    var require$$16 = /*@__PURE__*/getAugmentedNamespace(index_es$8);

    var require$$17 = /*@__PURE__*/getAugmentedNamespace(index_es$f);

    var require$$18 = /*@__PURE__*/getAugmentedNamespace(index_es$7);

    var require$$19 = /*@__PURE__*/getAugmentedNamespace(index_es$6);

    var require$$20 = /*@__PURE__*/getAugmentedNamespace(index_es$e);

    var require$$21 = /*@__PURE__*/getAugmentedNamespace(index_es$5);

    var require$$22 = /*@__PURE__*/getAugmentedNamespace(index_es$4);

    var require$$23 = /*@__PURE__*/getAugmentedNamespace(index_es$3);

    var require$$24 = /*@__PURE__*/getAugmentedNamespace(index_es$i);

    var require$$25 = /*@__PURE__*/getAugmentedNamespace(index_es$2);

    var require$$26 = /*@__PURE__*/getAugmentedNamespace(index_es$1);

    var require$$27 = /*@__PURE__*/getAugmentedNamespace(index_es);

    var lib = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(window,(function(){return function(e){var t={};function r(i){if(t[i])return t[i].exports;var n=t[i]={i:i,l:!1,exports:{}};return e[i].call(n.exports,n,n.exports,r),n.l=!0,n.exports}return r.m=e,r.c=t,r.d=function(e,t,i){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i});},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(r.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)r.d(i,n,function(t){return e[t]}.bind(null,n));return i},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="https://static.line-scdn.net/liff/edge/2/",r(r.s=0)}([function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0}),t.liff=void 0,r(1),r(2);var i=r(3).default;t.liff=i,t.default=i;},function(e,t){e.exports=require$$0;},function(e,t){e.exports=require$$1;},function(e,t,r){Object.defineProperty(t,"__esModule",{value:!0});var i=r(4),n=r(5),l=r(6),o=r(7),u=r(8),a=r(9),f=r(10),s=r(11),c=r(12),d=r(13),b=r(14),p=r(15),g=r(16),w=r(17),m=r(18),v=r(19),x=r(20),q=r(21),y=r(22),h=r(23),P=r(24),I=r(25),M=r(26),_=r(27),j=r(28),L=r(29),O=Object.defineProperties({},{getOS:{value:a.getOS,enumerable:!0,writable:!0},getVersion:{value:f.getVersion,enumerable:!0,writable:!0},getLanguage:{value:s.getLanguage,enumerable:!0,writable:!0},isInClient:{value:o.isInClient,enumerable:!0,writable:!0},isLoggedIn:{value:d.isLoggedIn,enumerable:!0,writable:!0},logout:{value:b.logout,enumerable:!0,writable:!0},getAccessToken:{value:l.getAccessToken,enumerable:!0,writable:!0},getIDToken:{value:l.getIDToken,enumerable:!0,writable:!0},getDecodedIDToken:{value:l.getDecodedIDToken,enumerable:!0,writable:!0},getContext:{value:l.getContext,enumerable:!0,writable:!0},openWindow:{value:m.openWindow,enumerable:!0,writable:!0},closeWindow:{value:v.closeWindow,enumerable:!0,writable:!0},getFriendship:{value:j.attachChecker(q.getFriendship,"profile"),enumerable:!0,writable:!0},getAId:{value:l.getAId,enumerable:!0,writable:!0},getProfilePlus:{value:l.getProfilePlus,enumerable:!0,writable:!0},getIsVideoAutoPlay:{value:l.getIsVideoAutoPlay,enumerable:!0,writable:!0},getLineVersion:{value:g.getLineVersion,enumerable:!0,writable:!0},isApiAvailable:{value:w.isApiAvailable,enumerable:!0,writable:!0},getProfile:{value:j.attachChecker(c.getProfile,"profile"),enumerable:!0,writable:!0},sendMessages:{value:j.attachChecker(x.sendMessages,"chat_message.write"),enumerable:!0,writable:!0},subWindow:{value:y.subWindow,enumerable:!0,writable:!0},ready:{value:u.ready,enumerable:!0,writable:!0},id:{get:function(){return l.getConfig().liffId||null},enumerable:!0},_dispatchEvent:{value:p.dispatch,enumerable:!0,writable:!0},_call:{value:p.call,enumerable:!0,writable:!0},_addListener:{value:p.addListener,enumerable:!0,writable:!0},_removeListener:{value:p.removeListener,enumerable:!0,writable:!0},_postMessage:{value:p.postMessage,enumerable:!0,writable:!0}}),k=new h.ModuleDriverImpl,A=new h.ModuleContextImpl(k,O),C=new h.UseModule(k,A,{namespacePrefix:""}).install();var T=new h.LiffPluginContextImpl(k,O);[new h.UseModule(k,T),new n.LoginModule,new i.InitModule,new P.AnalyticsModule,_.module,I.module,M.module,j.module,L.module].forEach((function(e){C.call(O,e);})),t.default=O;},function(e,t){e.exports=require$$2;},function(e,t){e.exports=require$$3;},function(e,t){e.exports=require$$4;},function(e,t){e.exports=require$$5;},function(e,t){e.exports=require$$6;},function(e,t){e.exports=require$$7;},function(e,t){e.exports=require$$8;},function(e,t){e.exports=require$$9;},function(e,t){e.exports=require$$10;},function(e,t){e.exports=require$$11;},function(e,t){e.exports=require$$12;},function(e,t){e.exports=require$$13;},function(e,t){e.exports=require$$14;},function(e,t){e.exports=require$$15;},function(e,t){e.exports=require$$16;},function(e,t){e.exports=require$$17;},function(e,t){e.exports=require$$18;},function(e,t){e.exports=require$$19;},function(e,t){e.exports=require$$20;},function(e,t){e.exports=require$$21;},function(e,t){e.exports=require$$22;},function(e,t){e.exports=require$$23;},function(e,t){e.exports=require$$24;},function(e,t){e.exports=require$$25;},function(e,t){e.exports=require$$26;},function(e,t){e.exports=require$$27;}]).default}));
    });

    var liff = /*@__PURE__*/getDefaultExportFromCjs(lib);

    /* src\App.svelte generated by Svelte v3.48.0 */

    const { document: document_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let script0;
    	let script0_src_value;
    	let script1;
    	let script1_src_value;
    	let t0;
    	let body_1;
    	let section0;
    	let img;
    	let img_src_value;
    	let t1;
    	let p0;
    	let t2;
    	let p1;
    	let t3;
    	let p2;
    	let t4;
    	let p3;
    	let t5;
    	let section1;
    	let t6;
    	let section2;

    	const block = {
    		c: function create() {
    			script0 = element("script");
    			script1 = element("script");
    			t0 = space();
    			body_1 = element("body");
    			section0 = element("section");
    			img = element("img");
    			t1 = space();
    			p0 = element("p");
    			t2 = space();
    			p1 = element("p");
    			t3 = space();
    			p2 = element("p");
    			t4 = space();
    			p3 = element("p");
    			t5 = space();
    			section1 = element("section");
    			t6 = space();
    			section2 = element("section");
    			if (!src_url_equal(script0.src, script0_src_value = "https://static.line-scdn.net/liff/edge/2/sdk.js")) attr_dev(script0, "src", script0_src_value);
    			add_location(script0, file, 43, 2, 1502);
    			if (!src_url_equal(script1.src, script1_src_value = "https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js")) attr_dev(script1, "src", script1_src_value);
    			add_location(script1, file, 44, 2, 1576);
    			attr_dev(img, "id", "pictureUrl");
    			if (!src_url_equal(img.src, img_src_value = "https://mokmoon.com/images/ic_liff.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1n279q7");
    			add_location(img, file, 50, 4, 1729);
    			attr_dev(p0, "id", "userId");
    			attr_dev(p0, "class", "svelte-1n279q7");
    			add_location(p0, file, 51, 4, 1802);
    			attr_dev(p1, "id", "displayName");
    			attr_dev(p1, "class", "svelte-1n279q7");
    			add_location(p1, file, 52, 4, 1824);
    			attr_dev(p2, "id", "statusMessage");
    			attr_dev(p2, "class", "svelte-1n279q7");
    			add_location(p2, file, 53, 4, 1851);
    			attr_dev(p3, "id", "status");
    			attr_dev(p3, "class", "svelte-1n279q7");
    			add_location(p3, file, 54, 4, 1880);
    			attr_dev(section0, "id", "profile");
    			add_location(section0, file, 49, 2, 1702);
    			attr_dev(section1, "id", "feature");
    			add_location(section1, file, 57, 2, 1914);
    			attr_dev(section2, "id", "button");
    			add_location(section2, file, 59, 2, 1942);
    			attr_dev(body_1, "id", "body");
    			attr_dev(body_1, "class", "svelte-1n279q7");
    			add_location(body_1, file, 48, 0, 1683);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script0);
    			append_dev(document_1.head, script1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body_1, anchor);
    			append_dev(body_1, section0);
    			append_dev(section0, img);
    			append_dev(section0, t1);
    			append_dev(section0, p0);
    			append_dev(section0, t2);
    			append_dev(section0, p1);
    			append_dev(section0, t3);
    			append_dev(section0, p2);
    			append_dev(section0, t4);
    			append_dev(section0, p3);
    			append_dev(body_1, t5);
    			append_dev(body_1, section1);
    			append_dev(body_1, t6);
    			append_dev(body_1, section2);
    		},
    		p: noop$1,
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			detach_dev(script0);
    			detach_dev(script1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body_1);
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
    	const body = document.getElementById("body");

    	// Button elements
    	const btnSend = document.getElementById("btnSend");

    	const btnClose = document.getElementById("btnClose");
    	const btnShare = document.getElementById("btnShare");
    	const btnLogIn = document.getElementById("btnLogIn");
    	const btnLogOut = document.getElementById("btnLogOut");
    	const btnScanCode = document.getElementById("btnScanCode");
    	const btnOpenWindow = document.getElementById("btnOpenWindow");

    	// Profile elements
    	const email = document.getElementById("email");

    	const userId = document.getElementById("userId");
    	const pictureUrl = document.getElementById("pictureUrl");
    	const displayName = document.getElementById("displayName");
    	const statusMessage = document.getElementById("statusMessage");

    	// QR element
    	const code = document.getElementById("code");

    	const friendShip = document.getElementById("friendShip");

    	async function getUserProfile() {
    		const profile = await liff.getProfile();
    		pictureUrl.src = profile.pictureUrl;
    		userId.innerHTML = "<b>userId:</b> " + profile.userId;
    		statusMessage.innerHTML = "<b>statusMessage:</b> " + profile.statusMessage;
    		displayName.innerHTML = "<b>displayName:</b> " + profile.displayName;
    	}

    	let promise = liff.init({ liffId: "1657163335-3GLvEy0J" }).then(async () => {
    		getUserProfile();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		liff,
    		body,
    		btnSend,
    		btnClose,
    		btnShare,
    		btnLogIn,
    		btnLogOut,
    		btnScanCode,
    		btnOpenWindow,
    		email,
    		userId,
    		pictureUrl,
    		displayName,
    		statusMessage,
    		code,
    		friendShip,
    		getUserProfile,
    		promise
    	});

    	$$self.$inject_state = $$props => {
    		if ('promise' in $$props) promise = $$props.promise;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

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
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
