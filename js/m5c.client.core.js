// polyfill
(function(){
	
	if( !Function.prototype.bind ){
		Function.prototype.bind = function( oThis ) {
			if (typeof this !== 'function') {
		      // closest thing possible to the ECMAScript 5
		      // internal IsCallable function
		      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		    }
		
		    var aArgs   = Array.prototype.slice.call(arguments, 1),
		        fToBind = this,
		        fNOP    = function() {},
		        fBound  = function() {
		          return fToBind.apply(this instanceof fNOP
		                 ? this
		                 : oThis,
		                 aArgs.concat(Array.prototype.slice.call(arguments)));
		        };
		
		    if (this.prototype) {
		      // native functions don't have a prototype
		      fNOP.prototype = this.prototype; 
		    }
		    fBound.prototype = new fNOP();
			//
		    return fBound;
		};
	}
	
})();


(function(){
	'use strict';
	var $$ = {},
	
	
	PI = Math.PI,
	RAD = Math.PI/180, // * degree
	DEG = 180/Math.PI,
	uuCount = 0; // * radian
	
	
	
	
	
	window['m5c'] = $$;
	
	
	
	/**
	 * util function
	 *  */
	// check array
	$$.__isArray = Array.isArray;
	$$.__isWindow = function( obj ) {
		return obj != null && obj === obj.window;
	};
	
	
	/**
	 * 첫글자 대문자로 변경.
	 *  */
	$$.__toFirstCapitalize = function( str ){
		return str.replace( /^\w/, function($1){ return $1.toUpperCase(); } );
	};
	
	/**
	 * 첫글자 소문자로 변경.
	 *  */
	$$.__toFirstLowerCase = function( str ){
		return str.replace( /^\w/, function($1){ return $1.toLowerCase(); } );
	};
	
	
	
	/**
	 * convert CamelCase.
	 * delimiter : '-' hyphen
	 *  */
	$$.__toCamelCase = function( str ){
		return str.toLowerCase().replace( /\-[a-z]/g, function( s, i ){
			if( i > 0 ){
				return s.replace(/\-/, '').toUpperCase();
			}else{
				return s.replace(/\-/, '');
			}
		} );
	};
	
	/**
	 * convert PascalCase.
	 * delimiter : '-' hyphen
	 *  */
	$$.__toPascalCase = function( str ){
		return str.replace( /\-[a-z]/g, function( s, i ){
			return s.replace(/\-/, '').toUpperCase();
		});
	};
	
	/**
	 * convert snakecase.
	 * delimiter : '-' hyphen
	 *  */
	$$.__toSnakeCase = function( str ){
		return str.replace(/[A-Z]/g, function(s,i){
			if( i > 0 ){
				return '-' + s.toLowerCase();
			}else{
				return s.toLowerCase();
			}
		}).toLowerCase();
	};
	
	
	$$.__clone = function(obj) {
	    var copy;
	
	    // Handle the 3 simple types, and null or undefined
	    if (null == obj || "object" != typeof obj) return obj;
	
	    // Handle Date
	    if (obj instanceof Date) {
	        copy = new Date();
	        copy.setTime(obj.getTime());
	        return copy;
	    }
	
	    // Handle Array
	    if (obj instanceof Array) {
	        copy = [];
	        for (var i = 0, len = obj.length; i < len; i++) {
	            copy[i] = m5c.__clone(obj[i]);
	        }
	        return copy;
	    }
	
	    // Handle Object
	    if (obj instanceof Object) {
	        copy = {};
	        for (var attr in obj) {
	            if (obj.hasOwnProperty(attr)) copy[attr] = m5c.__clone(obj[attr]);
	        }
	        return copy;
	    }
	
	    throw new Error("Unable to copy obj! Its type isn't supported.");
	};
	
	
	/**
	 * getComputedStyle
	 *  */
	$$.__computed = function( elem ){
		if( !window.getComputedStyle ){
			return elem.currentStyle;
		}else {
			if ( elem.ownerDocument.defaultView.opener ) {
				return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
			}
			return _computed( elem, null ); 
		}
	};
	
	
	
	/** TODO :: core
 	 *
	 * 
	 * 
	 *  */
	
	$$.core = {};
	
	
	
	var ConnectManager = function(){
		if( !(this instanceof ConnectManager) ){
			return new ConnectManager();
		}
	};
	
	ConnectManager.prototype = (function(){
		return {
			constructor : ConnectManager,
			version : '0.0.1',
			count : 1,
			conectors : {},
			uuidByUriList : {},
			/**
			 * @param key : uuid {int} [or uri {String} ]
			 * @return Connector
			 *  */
			getConnector : function( key ){
				if( typeof key === 'number' ){ // uuid === Number
					return this.conectors[key];
				}else{ // uri === string
					key = this.uuidByUriList[key];
					return this.conectors[key];
				}
			},
			/**
			 * @param conn {Connector}
			 *  */
			setConnector : function( conn ){
				this.conectors[conn.uuid] = conn;
			},
			/**
			 * @param uuid {int} Connector uuid
			 * @param uri {String} WebSocket URI
			 *  */
			updateList : function(uuid, uri){
				this.uuidByUriList[uri] = uuid;
			}
			
		}; 
	}());
	
	$$.core.connectManager = new ConnectManager();
	
	
	var MetadataManager = function(){
		if( !(this instanceof MetadataManager) ){
			return new MetadataManager();
		}
	};
	
	MetadataManager.prototype = (function(){
		return {
			constructor : ConnectManager,
			version : '0.0.1',
			nsMap : {},
			nsByUuidList : {},
			/**
			 * @param key : ns {String} [or uuid {int} ]
			 * @return Object
			 *  */
			getMetadata : function( key ){
				if( typeof key === 'number' ){ // uuid === Number
					key = this.nsByUuidList[key];
					return this.nsMap[key];
				}else{ // ns === string
					return this.nsMap[key];
				}
			},
			/**
			 * @param message {MessageEvent} 
			 *  */
			parse : function( message ){
				var data = message.data,
				json;
				// json type check
				try{
					var map, controls, control, item, uuid, ns;
					//
					json = JSON.parse( data );
					ns = json.ns;
					if( ns ){
						map = {};
						uuid = message.currentTarget.uuid;
						map.connectInfo = {
							origin : message.origin,
							timeStamp : message.timeStamp,
							uuid : uuid
						};
						map.header = {
							ns : ns,
							name : json.name,
							model : json.model,
							desc : json.desc
						};
						map.controls = {};
						map.controls.__proto__ = null;
						//
						//ns : {controls : { cmd : {}, cmd : {} }};
						controls = json.controls; 
						if( controls !== undefined && $$.__isArray( controls ) ){
							for( var i=0, len=controls.length;i<len;i+=1 ){
								control = controls[i].control;
								for( var j=0,jLen=control.length;j<jLen;j+=1 ){
									item = control[j];
									map.controls[item.cmd] = item;
								}
							}
						}
						//
						this.nsMap[ns] = map;
						this.nsByUuidList[uuid] = ns;
						json = null;
						map = null;
						controls = null;
						control = null;
						item = null;
					}
				}catch(e){
					//throw new Error( e );
					return;
				}
			}
		};
	}());
	
	$$.core.metadataManager = new MetadataManager();
	
	/**
	 * Connector
	 *  */
	var Connector = function(){
		if( !(this instanceof Connector) ){
			return new Connector();
		}
		this.uuid = $$.core.connectManager.count ++;
	};
	
	Connector.prototype = (function(){
		return {
			constructor : Connector,
			version : '0.0.1',
			uuid : 0,
			ws : null,
			uri : null,
			connected : false,
			options : {
				uri : "", // String
				protocols : null, // String or Array
			},
			onOpenCallback : null,
			onCloseCallback : null,
			onMessageCallback : null,
			onErrorCallback : null,
			init : function( options ){
				this.uri = options.uri;
				this.options = options || {};
				//
				$$.core.connectManager.updateList( this.uuid, this.uri );
				this.ws = this.getSocket( options.uri, options.protocols );
				this.setEvent();
			},
			setEvent : function( options ){
				var that = this;
				this.ws.onopen = function( e ){
					that.connected = true;
					that.onopen( e );
				};
				this.ws.onclose = function( e ){
					that.connected = false;
				};
				this.ws.onmessage = function( e ){
					that.onmessage( e );
				};
				this.ws.onerror = function( e ){
					that.onerror( e );
				};
			},
			getSocket : function( uri ){
				var socket = new WebSocket( uri );
				if( socket['uuid'] === undefined ){
					Object.defineProperties( socket, {uuid:{value:this.uuid}} );
				};
				return socket;
			},
			close : function(){
				if( !!this.ws ){
					this.ws.close();
				}
			},
			onopen : function(){ // Event
				if( typeof this.onOpenCallback === 'function' ){
					this.onOpenCallback.apply( null, arguments );
				}
			},
			onclose : function(){
				if( typeof this.onCloseCallback === 'function' ){
					this.onCloseCallback.apply( null, arguments );
				}
			},
			onmessage : function( e ){ // MessageEvent
				// parsing metadata
				$$.core.metadataManager.parse( e );
				//
				if( typeof this.onMessageCallback === 'function' ){
					this.onMessageCallback.apply( null, arguments );
				}
			},
			onerror : function(){ // Event
				if( typeof this.onErrorCallback === 'function' ){
					this.onErrorCallback.apply( null, arguments );
				}
			},
			send : function( msg ){
				this.ws.send( msg );
			}
		};
	}());
	
	$$.core.createConnector = function(){
		var manager = $$.core.connectManager,
		connector = new Connector(); 
		manager.setConnector( connector );
		//
		return connector;
	};
	
	$$.core.connector = $$.core.createConnector();
	
	
	/** TODO :: dom
 	 *
	 * 
	 * 
	 *  */
	
	$$.dom = {
		/**
		 * 클래스를 추가한다.
		 * @param target{HTMLElement}
		 * @param name 추가할 class name
		 *  */
		addClass : function( target, name ){
			if( !target ){
				return;
			}
			var classes = target.className.replace(/\s{2,}/g, ' ').replace(/\s/g, ','),
				exp = new RegExp( '(^|[,])'+name+'([,]|$)', 'g' );
			//
			if( exp.test( classes ) ){
				return;
			}
			//
			classes = classes.replace( /[,]/g, ' ') + ' ' + name;
			target.setAttribute( 'class', classes );
		},
		/**
		 * 클래스를 제거한다.
		 * @param target{HTMLElement}
		 * @param name 제거할 class name
		 *  */
		removeClass : function( target, name ){
			if( !target || !target.className ){
				return;
			}
			var classes = target.className.replace(/\s{2,}/g, ' ').replace(/\s/g, ','),
				exp = new RegExp( '(^|[,])'+name+'([,]|$)', 'g' );
			//
			if( exp.test( classes ) ){
				classes = classes.replace( exp, ',' ).replace( /[,]/g, ' ').replace(/^\s|\s$/g, '');
				target.setAttribute( 'class', classes );
			}
		},
		hasClass : function( target, name ){
			if( !target || !target.className ){
				return;
			}
			var classes = target.className.replace(/\s{2,}/g, ' ').replace(/\s/g, ','),
				exp = new RegExp( '(^|[,])'+name+'([,]|$)', 'g' );
			//
			return exp.test( classes );
		},
		/**
		 * @param target
		 * @param style {string} [or object]
		 * @param value {*}
		 *  */
		css : function( target, style, value ){
			if( !target ){
				return;
			}
			var name;
			if( typeof style === 'string' ){
				name = style;
				if( value === undefined ){
					return target.style[name];
				}else{
					m5c.dom._css( target, name, value );
				}
			}else{
				for( var key in style ){
					m5c.dom._css( target, key, style[key] );
				}
			}
		},
		_css : function( target, name, value ){
			var prop = name.indexOf('-')>-1? m5c.__toCamelCase( name ) : name;
			//
			target.style[prop] = value;
		}
	};
	
	
	
	$$.core.repo = {
		// data collection
		map : {},
		// repoId, cate [, key, date]
		// repoId, cate [, object]
		setRepo : function( repoId, cate, arg1, arg2 ){
			var domrepo = this.map[repoId] = this.map[repoId] || {},
				caterepo;
			//
			if( typeof cate === 'string' ){
				caterepo = domrepo[cate];
				caterepo = caterepo || {};
				//
				if( typeof arg1 === 'string' ){
					caterepo[arg1] = arg2;
				}else if(typeof arg1 === 'object'){
					// 일반 참조 복사( 기존데이터에 추가하는 형태. );
					try{
						for( var key in arg1 ){
							caterepo[key] = arg1[key];
						}
					}catch(e){
						//
					}
				}
				domrepo[cate] = caterepo;
			}
			return caterepo;
		},
		// get ::
		// repoId [, cate, key]
		getRepo : function( repoId, cate, key ){
			var domrepo = this.map[repoId],
				caterepo;
			//
			if( domrepo === undefined ){
				return;
			}
			if( typeof cate === 'string' ){
				caterepo = domrepo[cate];
				//
				if( caterepo === undefined ){
					return domrepo;
				}
				//
				if( typeof key === 'string' ){
					return caterepo[key];
				}else{ // 
					return caterepo;
				}
			}
			//
			return;
		},
		// repoId
		removeAll : function( repoId ){
			delete this.map[repoId];
		},
		// repoId, cate
		removeCategory : function( repoId, cate ){
			var domrepo = this.get( repoId );
			if( typeof domrepo === undefined ){
				return;
			}
			delete domrepo[cate];
		},
		// repoId, cate, key
		remove : function( repoId, cate, key ){
			var caterepo = this.get( repoId, cate );
			if( caterepo === undefined ){
				return;
			}
			if( typeof key === 'string' ){
				delete caterepo[key];
			}
		}
	};
	
	
	/**
	 * TODO :::
	 * 
	 * m5c.data = m5c.core.data.data
	 * 
	 *  */
	$$.core.data = {
		// defalt 1
		repoCnt : 1,
		// key get/set
		repoId : function( element ){
			var that = m5c.core.data;
			// 부여된 아이디가 없으면 아이디를 생성한다.
			if( element['repoId'] === undefined ){
				Object.defineProperties( element, {repoId:{value:this.repoCnt}} );
				that.repoCnt ++;
			}
			// 부여한 아이디를 반환한다.
			return element['repoId'];
		},
		setData : function( element, arg, udata ){
			var that = m5c.core.data, 
				repoId = that.repoId( element ),
				repo = m5c.core.repo.setRepo( repoId, 'data', arg, udata );
			//
			return repo;
		},
		getData : function( element, datakey ){
			var that = m5c.core.data, 
				repoId = that.repoId( element );
			if( repoId == undefined ){
				return ;
			}
			//
			return m5c.core.repo.getRepo( repoId, 'data', datakey );
		},
		/**
		 * @param arg1 HTMLElement
		 * @param arg2 String or Object
		 * @param arg3 * 
		 * //
		 * .data( HTMLElement ) // get : all data or {}
		 * .data( HTMLElement, key(String) ) // get : matching data
		 * .data( HTMLElement, key(String), data(*) ) // set : add
		 * .data( HTMLElement, data(Object) ) // set : replace or merge
		 *  */
		data : function( element, arg, udata ){
			// element가 없거나, nodeType이 1 또는 9가 아닐때는 undefined를 반환한다.
			if( !element || !(element.nodeType == 1 || element.nodeType == 9) ){
				return ;
			};
			//
			var that = m5c.core.data,
				result;
			if( arg === undefined ){
				result = that.getData( element );
			}else{
				if( typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'object' ){
					if( typeof arg === 'string' || typeof arg === 'number' ){ // has key
						if( !udata ){ // get
							result = that.getData( element, arg + '' );
						}else{
							result = that.setData( element, arg + '', udata );
						}
					}else{ // object
						result = that.setData( element, arg );
					}
					
				}
			}
			return result;
		}
	};
	//
	$$.data = $$.core.data.data;
	
	
	
	/**
	 *
	 * m5c.addEvent = m5c.core.event.add
	 * m5c.removeEvent = m5c.core.event.remove
	 *  */
	$$.core.event = {
		eventCnt : 1,
		/**
		 * 
		 * parameter : target, handler [, data1, data2, ...]
		 * @param target
		 * @param handler 
		 *  */
		getListener : function( target, handler ){
			var that = m5c.core.event,
			args = arguments;
			//
			return function( e ){
				var params = Array.prototype.slice.call( args, 2 ),
					result;
				//
				params.unshift( that.utils.getEventObject( e ) );
				result = handler.apply( target, params );
				// return false; 이벤트 전파 차단.
				if( result === false ){
					//
					e.stopImmediatePropagation();
					e.stopPropagation();
					e.preventDefault();
					return false;
				};
			};
		},
		stop : function( e ){
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		},
		/**
		 *
		 * @param target, type, [,bindTarget ,] handler [, data1, data2]
		 *  */
		add : function( target, type, arg1, arg2 ){
			if( !target || typeof target.addEventListener !== 'function' ){
				return;
			}
			//
			var that = m5c.core.event,
				args = arguments,
				fnId,
				handler,
				bindFn,
				bindTarget,
				data,
				eventName = type,
				mSlice = Array.prototype.slice;
			//	
			if( typeof arg1 === 'function' ){
				handler = arg1;
				data = mSlice.call( args, 3 );
				bindTarget = target;
			}else{
				if( typeof arg2 === 'function' ){
					handler = arg2;
					bindTarget = arg1;
					if( !bindTarget ){
						bindTarget = target;
					}
					data = mSlice.call( args, 4 );
				}else{
					// 핸들러가 없다.
					return;
				}
			}
			
			// 핸들러에 아이디 부여.
			if( handler['__m5c_fnid__'] === undefined ){
				Object.defineProperties( handler, {__m5c_fnid__:{value:m5c.core.event.eventCnt}} );
				m5c.core.event.eventCnt ++;
			}
			
			// 핸들러 아이디.
			fnId = handler['__m5c_fnid__'];
			
			
			if( target === bindTarget && data.length==0 ){
				bindFn = handler;
			}else{
				// 바인딩 함수를 생성한다.
				data.unshift( bindTarget, handler );
				bindFn = that.getListener.apply( that, data );
			}
			
			if( eventName.indexOf('.')>-1 ){
				eventName = eventName.slice( 0, eventName.indexOf( '.' ) );
			}
			
			// repo에 저장.
			// target, 카테고리, 키, 데이터
			// litener : 실제 등록될 함수
			// type : 실제 이벤트 타입
			// userType : 사용자가 등록한 이벤트명, ex) click, click.custom12345 ...
			m5c.core.repo.setRepo( m5c.core.data.repoId( target ), 'event', type+fnId, {listener:bindFn, type:eventName, userType:type} );
			
			// 이벤트 부여.
			target.addEventListener( eventName, bindFn );
		},
		remove : function( target, type, handler ){
			if( !target || typeof target.removeEventListener !== 'function' ){
				return;
			}
			//
			var fnId = handler === undefined? ''  : handler['__m5c_fnid__'] || '',
				repoKey = type + fnId,
				repo,
				fn;
			//
			if( typeof handler === 'function' ){
				repo = m5c.core.repo.getRepo( m5c.core.data.repoId( target ), 'event' );
				// 핸들러가 있을경우 해당 리스너만 해지
				if( !repo ){
					return;
				}
				//
				
				if( repo[repoKey] === undefined ){
					return;
				}
				
				fn = repo[repoKey].listener;
				if( typeof fn === 'function' ){
					target.removeEventListener( type, fn );
				}
				delete repo[repoKey];
				//
				return;
			}else{
				repo = m5c.core.repo.getRepo( m5c.core.data.repoId( target ), 'event' );
			}
			
			// 타입만 넘어오면 해당 이벤트 타입의 모든 이벤트 리스너를 해지
			var eventName, obj;
			for( var key in repo ){
				obj = repo[key];
				eventName = obj.type;
				if( type.indexOf('.')>-1 ){
					if( obj.userType === type ){
						fn = obj.listener;
						if( typeof fn === 'function' ){
							target.removeEventListener( eventName, fn );
							delete repo[key];
						}
					}
				}else{
					if( eventName === type ){
						fn = obj.listener;
						if( typeof fn === 'function' ){
							target.removeEventListener( eventName, fn );
							delete repo[key];
						}
					}
				}
			}
		}
		 
	};
	
	$$.core.event.utils = {
		/**
		 * 특정 기준선에 대한 비교를 통해 가로 또는 세로 움직임에 대한 방향값 반환
		 * 
		 * horizontal = 1
		 * vertical = 2
		 * 
		 * @param {Object} options 
		 *  - sx {Number} 시작 좌표
		 *  - sy {Number} 시작 좌표
		 *  - x {Number} 끝 좌표
		 *  - y {Number} 끝 좌표
		 *  - slope {Number} 기준 기울기 default : ( (window.innerHeight/2) / window.innerWidth ).toFixed(2) * 1
		 *  - limit {Number} 움직임 최소값 default : 5px
		 *  */
		getDirectionType : function( o ){
			var sx = o.sx,
				sy = o.sy,
				x = o.x,
				y = o.y,
				slope = o.slope || ( (window.innerHeight/2) / window.innerWidth ).toFixed(2) * 1,
				limit = o.limit || 5,
				//
				type = -1,
				tx = Math.abs( sx-x ),
				ty = Math.abs( sy-y ),
				dst = Math.sqrt( (tx*tx) + (ty*ty) );
			//
			
			//
			if( dst < limit ) { return type; };	// min move px
			
			if( tx==0 ){
				type = 2;
			}else if( ty==0 ){
				type = 1;
			}else{
				var userSlope = parseFloat( (ty/tx).toFixed(2), 10 );
				//
				if( userSlope > slope ){
					type = 2; // v
				}else{
					type = 1; // h
				}
			}
			//
			return type;
		},
		getTouchEventObject : function ( e ){
			if( e.type.indexOf( 'touch' ) < 0 ){ // mouseEvent
				return [{
					identifier : 0,
					target : e.target,
					pageX : e.clientX,
					pageY : e.clientY,
					screenX : 0,
					screenY : 0,
				}];
			}else{ // touchEvent
				return e.touches || e.changedTouches;
			}
		},
		getEventNames : function (){
			var evtNm = {
				start : 'mousedown',
				end : 'mouseup',
				move : 'mousemove',
				cancel : 'mouseleave'
			};
			
			if('ontouchstart' in window){ //  other mobile browser
				evtNm.start = 'touchstart';
				evtNm.move  = 'touchmove';
				evtNm.end = 'touchend';
				evtNm.cancel = 'touchcancel';
			} else if(window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0) { // ie mobile browser
				evtNm.start = 'MSPointerDown';
				evtNm.move  = 'MSPointerMove';
				evtNm.end = 'MSPointerUp';
				evtNm.cancel = 'MSPointerCancel';
			}
			
			return evtNm;
		},
		getEventObject : function( e ){
			return e || window.event;
		}
	};
	
	var Gesture = $$.core.event.Gesture = function(){
		if( !(this instanceof Gesture) ){
			return new Gesture();
		}
	};
	
	Gesture.prototype = (function(){
		var OUtils = m5c.core.event.utils,
		oEvtNm = (function(){
			var ename = OUtils.getEventNames(),
			value = new Date *1,
			customName = {};
			
			for( var key in ename ){
				customName[key] = ename[key] + '.gusture' + value + ( Math.random() * 1e9 >>> 0 );
			};
			
			return customName;
		}()),
		mSlice = Array.prototype.slice,
		mEvent = m5c.core.event,
		getDirectionType = OUtils.getDirectionType,
		getTouchEventObject = OUtils.getTouchEventObject;
		
		//
		function isFunction( func ){
			return typeof func === 'function';
		}
		
		//direction : left, right, down, up		
		return {
			ON_DRAG_MOVE : "onDragMove",
			ON_TAB : "onTab",
			ON_PINCH : "onPinch",
			ON_PAN_H : "onPanH",
			ON_PAN_V : "onPanV",
			
			_options : {},
			_target : null,
			_callbackContext : null,
			_slope : 0,
			_info : {},
			_minMove : 5,
			_direction : -1, // 움직임방향
			_uxtype : 0, // { free : 0, horizontal : 1, vertical : 2 }
			
			init : function( options ){
				var uxtypes = { free : 0, horizontal : 1, vertical : 2 };
					options = options || {};
				
				// 타겟 및 이벤트 타겟 설정
				this._target = options.target;
				this._options.callbackContext = options.callbackContext || null;
				
				// 기본 컨트롤 이벤트에 대해 콜백으로 제공함.
				this._options.onStart = options.onStart;
				this._options.onEnd = options.onEnd;
				this._options.onCancel = options.onCancel;
				
				// uxtype
				this._uxtype = uxtypes[options.uxType] || 0;
				
				// 최소 움직임값
				this._minMove = options.minMovePx || 5;
				
				// 기울기 설정.
				this._slope = options.slope || ( (window.innerHeight/2) / window.innerWidth ).toFixed(2) * 1, // 기울기체크 기준값,
				
				//
				this._setEvent();
				return this;
			},
			_setEvent : function(){
				var target = this._target;
				if( !target || typeof target.addEventListener !== 'function' ){
					return;
				}
				mEvent.add( target, oEvtNm.start, this, this._onStart );
				mEvent.add( target, oEvtNm.cancel, this, this._onCancel );
			},
			_onStart : function(e){
				var body = document.body,
					target = this._target,
					touches = getTouchEventObject(e),
					touch;
				//
				this._direction = -1;
				//
				switch( touches.length ){
					case 2 :
						var dx = touches[0].pageX - touches[1].pageX,
							dy = touches[0].pageY - touches[1].pageY,
							dist = Math.sqrt( dx * dx + dy * dy );
						//
						this._info = {
							length : touches.length,
							oldTouches : [],
							touches : touches,
							startDist : dist,
							oldDist : 0,
							thisDist : dist,
							distGab : 0
						};
						//
						this._dispatchEvent( this.ON_PINCH );
					break;
					case 1 :
						touch = touches[0];
						this._info = {
							length : touches.length,
							touches : touches,
							startX : touch.pageX,
							startY : touch.pageY,
							oldX : 0,
							oldY : 0,
							thisX : touch.pageX,
							thisY : touch.pageY,
							gabX : 0,
							gabY : 0
						};
					break;
					default :
					break;
				}
				//
				mEvent.add( body, oEvtNm.move, this, this._onMove );
				mEvent.add( body, oEvtNm.end, this, this._onEnd );
				//
				var callback = this._options.onStart;
				if( isFunction( callback ) ){
					callback.apply( this._callbackContext, [e, this._info] );
				}
			},
			_onEnd : function( e ){
				var body = document.body,
					touches = getTouchEventObject(e);
				//
				mEvent.remove( body, oEvtNm.move, this, this._onMove );
				mEvent.remove( body, oEvtNm.end, this, this._onEnd );
				//
				
				if( touches.length<2 && this._direction < 0 ){
					this._dispatchEvent( this.ON_TAB );
				}
				
				//
				var callback = this._options.onEnd;
				if( isFunction( callback ) ){
					callback.apply( this._callbackContext, [e, this._info] );
				}
			},
			_onMove : function( e ){
				// 이벤트 차단.
				mEvent.stop( e );
				
				var target = this._target,
					touches = getTouchEventObject(e),
					info = this._info,
					touch;
				//
				switch( touches.length ){
					case 2 :
						this._direction = 3;
						var dx = touches[0].pageX - touches[1].pageX,
							dy = touches[0].pageY - touches[1].pageY;
						//
						info.length = touches.length;
						info.oldTouches = info.touches,
						info.touches = touches;
						info.oldDist = info.thisDist;
						info.thisDist = Math.sqrt( dx * dx + dy * dy );
						info.distGab = info.thisDist - info.oldDist;
						this._info = info;
						info = null;
						//
						this._dispatchEvent( this.ON_PINCH );
					break;
					case 1 :
						touch = touches[0];
						info.length = touches.length;
						info.touches = touches;
						info.oldX = info.thisX;
						info.oldY = info.thisY;
						info.thisX = touch.pageX;
						info.thisY = touch.pageY;
						info.gabX = info.thisX - info.oldX;
						info.gabY = info.thisY - info.oldY;
						//
						var direction = -1;
						if( this._direction < 0 ){
							direction = getDirectionType({
								sx : info.startX,
								sy : info.startY,
								x : info.thisX,
								y : info.thisY,
								slope : this._slope,
								limit : this._minMove
							});
							//
							if( direction < 0 ){
								return false;
							}
							this._direction = direction;
						}
						//
						if( this._uxtype > 0 && this._uxtype != this._direction ){ // free 가 아닐때.( horizontal, vertical )
							var body = document.body;
							mEvent.remove( body, oEvtNm.move, this, this._onMove );
							mEvent.remove( body, oEvtNm.end, this, this._onEnd );
							return false;
						}
						
						if( this._uxtype === 1 ){
							this._dispatchEvent( this.ON_PAN_H );
						}else if( this._uxtype === 2 ){
							this._dispatchEvent( this.ON_PAN_V );
						}else{
							this._dispatchEvent( this.ON_DRAG_MOVE );
						}
						
						
					break;
					default :
					break;
				}
			},
			_onCancel : function( e ){
				this._isStarted = false;
				//
				var callback = this._options.onCancel;
				if( isFunction( callback ) ){
					callback.apply( this._callbackContext, arguments );
				}
			},
			_dispatchEvent : function( type ){
				var event = document.createEvent( "Event" );
				event.initEvent( type, true, true );
				event.info = this._info;
				this._target.dispatchEvent( event );
			}
		};
	}());
	
	
	
	$$.addEvent = $$.core.event.add;
	$$.removeEvent = $$.core.event.remove;
	$$.Gesture = $$.core.event.Gesture; 
	
	
	
	
	
	
	
	
	
	/** 
	 * register
	 *  */
	var registList = [];
	$$.registered = false;
	$$._register = function(){
		if( $$.registered ){
			return;
		}
		$$.registered = true;
		
		var proto;
		var i=0, len=registList.length, opt;
		for(;i<len;i+=1){
			opt = registList[i];
			proto = opt.prototype;
			proto.initLifecycle( opt.lifecycles );
			
			document.registerElement( opt.is, {prototype : proto} );
			
			var containers = Array.prototype.slice.call( document.querySelectorAll( opt.is ), 0 );
			containers.forEach( function( container ,j ){
				var root = container.createShadowRoot();
				var template = $$.component.getResource( opt.template );
				var clone = document.importNode(template.content, true);
				// save shadowRoot
				container.root = root;
				root.appendChild( clone );
				if( !!opt.lifecycles && typeof opt.lifecycles.readyCallback === 'function' ){
					container.readyState = 'ready';
					container._dispatchEvent( container, 'componentReady' );
					opt.lifecycles.readyCallback.call( container );
				};
			} );
		}
	};
	
	$$.register = function( options ){
		registList.push( options );
	};
	
	$$.ready = function( callback ){
		function start(){
			$$._register();
			if( typeof callback === 'function' ){
				callback();
			}
		};
		
		function boot(){
			$$.component.parsingImportDoc();
			removeEventListener( 'WebComponentsReady', boot );
			//
			var that = this,
			config = m5c.config;
			if( !!config && config.isConnect && config.connUri.replace(/\s/ig, '').length > 0 ){
				if( $$.core.connector.uri === undefined ){
					$$.core.connector.init({
						uri : config.connUri
					});
				}else{
					start();
					return;
				}
			}else{
				start();
				return;
			}
			//
			start();
		}
		//
		if (window.WebComponents) {
			addEventListener( 'WebComponentsReady', boot );
		} else {
			if (document.readyState === 'interactive' || document.readyState === 'complete') {
				boot();
			} else {
				addEventListener( 'DOMContentLoaded' , boot);
			}
		}
	};
	
	$$.ready();
	
	
	
})();
