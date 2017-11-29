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



(function(){
	'use strict';
	/** TODO : component
	 *
	 * 
	 * 
	 *  */
	
	var $$ = window['m5c'] || {};
	
	$$.component = {
		uuidCount : 0,
		// import 된 Document 들을 저장할 리스트.
		docList : [],
		// import 된 Document 들을 저장함.
		parsingImportDoc : function(){
			var links = document.querySelectorAll('link[rel=import]'),
				link = null; // link.import,
			
			// TODO 없을경우 저장할 곳을 비워야 한다.
			if( links.length == 0 ){
				return;
			}
			
			var i=0, len = links.length;
			for(;i<len;i+=1){
				link = links[i];
				this.docList.push( link.import );
			}
		},
		/**
		 *
		 * @param id {String} template id
		 *  */
		getResource : function( id ){
			var docList = this.docList,
				doc = null,
				el = null,
				i=0, len = docList.length; 
			//
			for(;i<len;i+=1){
				doc = docList[i];
				el = doc.querySelector( id ); 
				if( el ){
					return el;
					break;
				}
			}
			return;
		}
	};
	
	$$.component.getCreateElementUUID = function(){
		return '__m' + ( Math.random() * 1e9 >>> 0 ) + '_' + ( $$.component.uuidCount ++);
	};
	
	
	
	var _componentProperties = {
		TAB : {
			value : 'tab'
		},
		_uuid : {
			value : "",
			writable : true,
			enumerable : true
		},
		get uuid(){
			return this._uuid;
		},
		set uuid( id ){
			this._uuid = id;
		},
		_readyState : {
			value : "",
			writable : true
		},
		readyState : {
			get : function(){
				return this._readyState;
			},
			set : function( v ){
				this._readyState = v;
			}
		},
		_lifecycleCallbacks : {
			writable : true,
			value : {
				createdCallback : null,
				attachedCallback : null,
				detachedCallback : null,
				attributeChangedCallback : null
			}
		},
		_root : {
			writable : true,
			value : null
		},
		get root(){
			return this._root;
		},
		set root(r){
			this._root = r;
		},
		init : {
			value : function(){
				
			}
		},
		initAttributes : {
			value : function(){
				// must override
			}
		},
		initLifecycle : {
			value : function( callbacks ){
				if( callbacks !== undefined && !!callbacks ){
					this._lifecycleCallbacks = callbacks;
				}
				//
				this.createdCallback = this.onCreatedCallback;
				this.attachedCallback = this.onAttachedCallback;
				this.detachedCallback = this.onDetachedCallback;
				this.attributeChangedCallback = this.onAttributeChangedCallback;
			}
		},
		onCreatedCallback : { value : function(){
			this.applyLifecycleCallback( 'createdCallback', arguments );
		} },
		onAttachedCallback : { value : function(){
			this.applyLifecycleCallback( 'attachedCallback', arguments );
		} },
		onDetachedCallback : { value : function(){
			this.applyLifecycleCallback( 'detachedCallback', arguments );
		} },
		onAttributeChangedCallback : { value : function(){
			this.applyLifecycleCallback( 'attributeChangedCallback', arguments );
		} },
		applyLifecycleCallback : {
			value : function( fname, args ){
				if( typeof this._lifecycleCallbacks[fname] === 'function' ){
					this._lifecycleCallbacks[fname].apply( this, args );
				}
			}
		},
		_dispatchEvent : {
			value : function( target, type, info ){
				var event = document.createEvent( "Event" );
				event.initEvent( type, true, true );
				if( info ){
					event.info = info;
				}
				target.dispatchEvent( event );
			}
		}
	};
	
	var _buttonProperties = $$.component.buttonPrototype = {
		ON_TAB : { value : 'onTab' },
		state : {
			set : function( v ){
				this.setAttribute( 'state', v);
			},
			get : function(){
				return this.getAttribute( 'state' );
			}
		},
		_toggle : { writable : true },
		toggle : {
			set : function( v ){
				this.setAttribute( 'toggle', v);
			},
			get : function(){
				return this.getAttribute( 'toggle' );
			}
		},
		_disabled : { writable: true  },
		disabled : {
			set : function( v ){
				this.setAttribute( 'disabled', v);
			},
			get : function(){
				return this.getAttribute( 'disabled' );
			}
		},
		init : {
			value : function(){
				this.uuid = m5c.component.getCreateElementUUID();
				this.initAttributes();
			}
		},
		create : {
			value : function(){
				var root = this.root,
					wrap = root.querySelector('.m5c-button'),
					eNames = m5c.core.event.utils.getEventNames();
				//
				
				this.setState( this.state );
				
				if( this._disabled ){
					this.setDisabled( this._disabled );
				}else{
					m5c.addEvent( wrap, eNames.start, this, this.onStart);
					m5c.addEvent( wrap, eNames.end, this, this.onEnd );
				}
				
			}
		},
		initAttributes : {
			value : function(){
				var disabled = this.getAttribute('disabled');
				if( disabled==='disabled' || disabled === true || disabled === '' ){
					this._disabled = true;
				}else{
					this._disabled = false;
				}
				//
				var toggle = this.getAttribute('toggle')+'' == 'true' ? true : false;
				this._toggle = toggle;
			}
		},
		onStart : {
			value : function(){
				if( this._toggle ){
					if( this.state == 'press' ){
						this.state = 'normal';
					}else{
						this.state = 'press';
					}
					this.onClicked();
				}else{
					this.state = 'press';
				}
			}
		},
		onEnd : {
			value : function(){
				if( !this._toggle ){
					this.state = 'normal';
					this.onClicked();
				}
			}
		},
		onClicked : {
			value : function(){
				if( this._toggle ){
					this._dispatchEvent( this, this.ON_TAB );
				}else{
					this._dispatchEvent( this, this.ON_TAB );
				}
			}
		},
		setDisabled : {
			value : function( bool ){
				var root = this.root,
					wrap = root.querySelector('.m5c-button'),
					eNames = m5c.core.event.utils.getEventNames();
				if( bool ){
					m5c.removeEvent( wrap, eNames.start, this.onStart);
					m5c.removeEvent( wrap, eNames.end, this.onEnd );
					//
					if( m5c.dom.hasClass(wrap, 'm5c-button-normal') ){
						m5c.dom.removeClass(wrap, 'm5c-button-normal');
					}
					if( m5c.dom.hasClass(wrap, 'm5c-button-press') ){
						m5c.dom.removeClass(wrap, 'm5c-button-press');
					}
					if( !m5c.dom.hasClass(wrap, 'm5c-button-disabled') ){
						m5c.dom.addClass(wrap, 'm5c-button-disabled');
					}
				}else{
					if( m5c.dom.hasClass(wrap, 'm5c-button-disabled') ){
						m5c.dom.removeClass(wrap, 'm5c-button-disabled');
					}
					if( this.state == 'press' ){
						if( !m5c.dom.hasClass(wrap, 'm5c-button-press') ){
							m5c.dom.addClass(wrap, 'm5c-button-press');
						}
					}else {
						if( !m5c.dom.hasClass(wrap, 'm5c-button-normal') ){
							m5c.dom.addClass(wrap, 'm5c-button-normal');
						}
					}
					//
					m5c.addEvent( wrap, eNames.start, this, this.onStart);
					m5c.addEvent( wrap, eNames.end, this, this.onEnd );
				}
			}
		},
		setState : {
			value : function( state ){
				var root = this.root,
					wrap = root.querySelector('.m5c-button');
				//
				if( this.state == 'press' ){
					if( m5c.dom.hasClass(wrap, 'm5c-button-normal') ){
						m5c.dom.removeClass(wrap, 'm5c-button-normal');
					}
					if( !m5c.dom.hasClass(wrap, 'm5c-button-press') ){
						m5c.dom.addClass(wrap, 'm5c-button-press');
					}
				}else{
					if( m5c.dom.hasClass(wrap, 'm5c-button-press') ){
						m5c.dom.removeClass(wrap, 'm5c-button-press');
					}
					if( !m5c.dom.hasClass(wrap, 'm5c-button-normal') ){
						m5c.dom.addClass(wrap, 'm5c-button-normal');
					}
				}
			}
		},
		onAttributeChangedCallback : { value : function( name, oldValue, newValue ){
			if( this.applyLifecycleCallback( 'attributeChangedCallback', arguments ) === false ){
				return;
			};
			//
			switch( name ){
				case 'disabled' :
					if( newValue==='disabled' || newValue === true || newValue === '' ){
						this._disabled = true;
					}else{
						this._disabled = false;
					}
					this.setDisabled( this._disabled );
				break;
				case 'toggle' :
					this._toggle = newValue+'' == 'true' ? true : false;
				break;
				case 'state' :
					if( !this._disabled ){
						this.setState( this.state );
					}
				break;
			}
		} }
	};
	
	var _toggleProperties = $$.component.togglePrototype = {
		ON_TAB : { value : 'onTab' },
		state : {
			set : function( v ){
				this.setAttribute( 'state', v);
			},
			get : function(){
				return this.getAttribute( 'state' );
			}
		},
		_disabled : { writable: true  },
		disabled : {
			set : function( v ){
				this.setAttribute( 'disabled', v);
			},
			get : function(){
				return this.getAttribute( 'disabled' );
			}
		},
		init : {
			value : function(){
				this.uuid = m5c.component.getCreateElementUUID();
				this.initAttributes();
			}
		},
		create : {
			value : function(){
				var root = this.root,
					wrap = root.querySelector('.m5c-toggle-button'),
					eNames = m5c.core.event.utils.getEventNames();
				//
				
				this.setState( this.state );
				
				if( this._disabled ){
					this.setDisabled( this._disabled );
				}else{
					m5c.addEvent( wrap, eNames.start, this, this.onStart);
					m5c.addEvent( wrap, eNames.end, this, this.onEnd );
				}
				
			}
		},
		initAttributes : {
			value : function(){
				var disabled = this.getAttribute('disabled');
				if( disabled==='disabled' || disabled === true || disabled === '' ){
					this._disabled = true;
				}else{
					this._disabled = false;
				}
			}
		},
		onStart : {
			value : function(){
				//
			}
		},
		onEnd : {
			value : function(){
				if( this.state == 'press' ){
					this.state = 'normal';
				}else{
					this.state = 'press';
				}
				this.onClicked();
			}
		},
		onClicked : {
			value : function(){
				if( this._toggle ){
					this._dispatchEvent( this, this.ON_TAB );
				}else{
					this._dispatchEvent( this, this.ON_TAB );
				}
			}
		},
		setDisabled : {
			value : function( bool ){
				var root = this.root,
					wrap = root.querySelector('.m5c-toggle-button'),
					eNames = m5c.core.event.utils.getEventNames();
				if( bool ){
					m5c.removeEvent( wrap, eNames.start, this.onStart);
					m5c.removeEvent( wrap, eNames.end, this.onEnd );
					//
					if( !m5c.dom.hasClass(wrap, 'disabled') ){
						m5c.dom.addClass(wrap, 'disabled');
					}
				}else{
					if( m5c.dom.hasClass(wrap, 'disabled') ){
						m5c.dom.removeClass(wrap, 'disabled');
					}
					//
					m5c.addEvent( wrap, eNames.start, this, this.onStart);
					m5c.addEvent( wrap, eNames.end, this, this.onEnd );
				}
			}
		},
		setState : {
			value : function( state ){
				var root = this.root,
					wrap = root.querySelector('.m5c-toggle-button');
				//
				if( this.state == 'press' ){
					if( m5c.dom.hasClass(wrap, 'm5c-toggle-button-off') ){
						m5c.dom.removeClass(wrap, 'm5c-toggle-button-off');
					}
					if( !m5c.dom.hasClass(wrap, 'm5c-toggle-button-on') ){
						m5c.dom.addClass(wrap, 'm5c-toggle-button-on');
					}
				}else{
					if( m5c.dom.hasClass(wrap, 'm5c-toggle-button-on') ){
						m5c.dom.removeClass(wrap, 'm5c-toggle-button-on');
					}
					if( !m5c.dom.hasClass(wrap, 'm5c-toggle-button-off') ){
						m5c.dom.addClass(wrap, 'm5c-toggle-button-off');
					}
				}
			}
		},
		onAttributeChangedCallback : { value : function( name, oldValue, newValue ){
			if( this.applyLifecycleCallback( 'attributeChangedCallback', arguments ) === false ){
				return;
			};
			//
			switch( name ){
				case 'disabled' :
					if( newValue==='disabled' || newValue === true || newValue === '' ){
						this._disabled = true;
					}else{
						this._disabled = false;
					}
					this.setDisabled( this._disabled );
				break;
				case 'state' :
					if( !this._disabled ){
						this.setState( this.state );
					}
				break;
			}
		} }
	};
	
	var _sliderProperties = $$.component.sliderPrototype = {
		_wrap : {writable : true},
		_startPoint : {writable : true},
		_point : {writable : true},
		_rail : {writable : true},
		_gage : {writable : true},
		_valueLabel : {writable : true},
		_minLabel : {writable : true},
		_maxLabel : {writable : true},
		_disabled : { writable: true  },
		disabled : {
			set : function( v ){
				this.setAttribute( 'disabled', v);
			},
			get : function(){
				return this.getAttribute( 'disabled' );
			}
		},
		_isFirst : {writable : true, value : true},
		isdouble : {
			set : function( v ){
				this.setAttribute( 'isdouble', v);
			},
			get : function(){
				var bool = this.getAttribute( 'isdouble' );
				if( bool == 'true' || bool == true ){
					return true;
				}else{
					return false;
				}
			}
		},
		min : {
			set : function( v ){
				var val = parseFloat( v, 10 ) || 0;
				this.setAttribute('min', val);
			},
			get : function(){
				return parseFloat( this.getAttribute('min'), 10 ) || 0;
			}
		},
		max : {
			set : function( v ){
				var val = parseFloat( v, 10 ) || 0;
				this.setAttribute('max', val);
			},
			get : function(){
				return parseFloat( this.getAttribute('max'), 10 ) || 0;
			}
		},
		_value : {writable:true},
		value : {
			set : function( v ){
				var val = parseFloat( v, 10 ) || 0;
				this.setAttribute('value', val);
			},
			get : function(){
				return parseFloat( this.getAttribute('value'), 10 ) || 0;
			}
		},
		_start : {writable:true},
		start : {
			set : function( v ){
				var val = parseFloat( v, 10 ) || 0;
				this.setAttribute('start', val);
			},
			get : function(){
				return parseFloat( this.getAttribute('start'), 10 ) || 0;
			}
		},
		step : {
			set : function( v ){
				var val = parseFloat( v, 10 ) || 0;
				this.setAttribute('step', val);
			},
			get : function(){
				return parseFloat( this.getAttribute('step'), 10 ) || 0;
			}
		},
		_total : {
			writable : true,
			value : 0
		},
		total : {
			set : function( v ){
				this._total = v;
			},
			get : function(){
				return this._total;
			}
		},
		_distance : {
			writable : true,
			value : 0
		},
		distance : {
			set : function( v ){
				this._distance = v;
			},
			get : function(){
				return this._distance;
			}
		},
		init : {
			value : function(){
				this.uuid = m5c.component.getCreateElementUUID();
				this.initAttributes();
			}
		},
		create : {
			value : function(){
				var root = this.root;
				this._wrap = root.querySelector( '.m5c-slider' );
				this._rail = root.querySelector( '.m5c-slider-bar-bg' );
				this._gage = root.querySelector( '.m5c-slider-bar-gage' );
				this._startPoint = root.querySelector( '.m5c-slider-bar-point-start' );
				this._point = root.querySelector( '.m5c-slider-bar-point' );
				this._minLabel = root.querySelector( '.m5c-slider-min' );
				this._maxLabel = root.querySelector( '.m5c-slider-max' );
				this._valueLabel = root.querySelector( '.m5c-slider-text' );
				//
				this._isFirst = false;
				//
				this.total = this.max - this.min;
				//
				if( this.isdouble ){
					this._startPoint.style.display = 'block';
				}
				//
				m5c.addEvent( window, 'resize.'+this.uuid, this, this.onResize);
				if( this._disabled ){
					this.setDisabled( this._disabled );
				}else{
					this.setEvent( true );
				}
				//
				this.setLabel();
				this.onResize();
			}
		},
		setEvent : {
			value : function( resize ){
				var targets = [this._point],
					target = null,
					gesture = null;
				if( this.isdouble ){
					targets.push( this._startPoint );
				}
				//
				for( var i=0, len=targets.length; i<len; i+=1 ){
					target = targets[i];
					gesture = new m5c.Gesture();
					gesture.init( {
						target : target,
						callbackContext : this,
						uxType : "free",
						minMovePx : 1,
						onStart : function(e, info){},
						onEnd : function(e, info){},
						onCancel : function(e, info){}
					} );
					m5c.addEvent( target, gesture.ON_DRAG_MOVE, this, this.onDragMove, i? false : true );
				}
			}
		},
		removeEvent : {
			value : function(){
				var targets = [this._point],
					target = null,
					type = m5c.Gesture.prototype.ON_DRAG_MOVEE;
				if( this.isdouble ){
					targets.push( this._startPoint );
				}
				for( var i=0, len=targets.length; i<len; i+=1 ){
					target = targets[i];
					m5c.removeEvent( target, type, this.onDragMove );
				}
			}
		},
		onResize : {
			value : function(){
				this.distance = this._rail.offsetWidth - this._point.offsetWidth;
				if( this.isdouble ){
					this.distance -= this._startPoint.offsetWidth;
				}
				this.setPosition();
			}
		},
		onDragMove : {
			value : function(e, right){
				var point = e.currentTarget,
					startW = this._startPoint.offsetWidth,
					startLimit = 0,
					endLimit = 0,
					isdouble = this.isdouble,
					value,
					gageX,
					gageW,
					gageGab = isdouble? startW : 0,
					x;
				//
				
				if( right ){
					if( isdouble ){
						startLimit = (parseFloat( this._startPoint.style.left, 10 ) || 0) + startW;
						endLimit = this.distance + startW;
					}else{
						startLimit = 0;
						endLimit = this.distance;
					}
				}else{
					startLimit = 0;
					endLimit = parseFloat( this._point.style.left, 10 ) - this._point.offsetWidth;
				}
				
				x = parseFloat( point.style.left || 0, 10 ) + e.info.gabX;
				
				//
				
				if( x < startLimit ){
					x = startLimit;
				}else if( x > endLimit ){
					x = endLimit;
				}
				
				if( isdouble && right ){
					value = this.min + Math.round( (x-startW) * this.total / (this.distance) );
				}else{
					value = this.min + Math.round( x * this.total / this.distance );
				}
				
				point.style.left = x  + 'px';
				
				gageX = ( parseFloat( this._startPoint.style.left, 10 )  || 0 )  + gageGab;
				gageW = parseFloat( this._point.style.left, 10 ) - gageX;
				this._gage.style.left = gageX + 'px';
				this._gage.style.width = gageW + 'px';
				
				if( right ){
					this._value = value;
					this.value = value;
				}else{
					this._start = value;
					this.start = value;
				}
			}
		},
		setPosition : {
			value : function(){
				var	startW = 0,
					sx = 0,
					x = 0;
				//
				if( this.isdouble ){
					startW = this._startPoint.offsetWidth;
					x = (this.start - this.min) * this.distance / this.total;
					this._startPoint.style.left = x + 'px';
					//
				}
				//
				x = (this.value - this.min) * this.distance / this.total;
				x += startW;
				sx = parseFloat( this._startPoint.style.left, 10 )  || 0;
				//
				this._point.style.left = x + 'px';
				this._gage.style.left = (sx + startW) + 'px';
				this._gage.style.width = ( x - sx ) + 'px';
			}
		},
		setLabel : {
			value : function(){
				if( this._isFirst ) return;
				//
				this._minLabel.innerHTML = this.min;
				this._maxLabel.innerHTML = this.max;
				if( this.isdouble ){
					this._valueLabel.innerHTML = this.start + '-' + this.value;
				}else{
					this._valueLabel.innerHTML = this.value;
				}
			}
		},
		update : {
			value : function( bool ){
				if( bool ){
					this.setPosition();
				}
				this.setLabel();
			}
		},
		setDisabled : {
			value : function( bool ){
				if( bool ){
					this.removeEvent();
					if( !m5c.dom.hasClass(this._wrap, 'disabled') ){
						m5c.dom.addClass(this._wrap, 'disabled');
					}
				}else{
					if( m5c.dom.hasClass(this._wrap, 'disabled') ){
						m5c.dom.removeClass(this._wrap, 'disabled');
					}
					this.setEvent();
				}
			}
		},
		initAttributes : {
			value : function(){
				//console.log( this.min, this.value, this.max, this.step, this.disabled );
				var disabled = this.getAttribute( 'disabled' );
				if( disabled==='disabled' || disabled === true || disabled === '' ){
					this._disabled = true;
				}else{
					this._disabled = false;
				}
				
				if( this.getAttribute( 'start' ) === null || isNaN( this.getAttribute( 'start' ) ) ){
					this._start = this.min;
					this.start = this.min;
				}
			}
		},
		onAttributeChangedCallback : { value : function( name, oldValue, newValue ){
			if( this.applyLifecycleCallback( 'attributeChangedCallback', arguments ) === false ){
				return;
			};
			//
			var isupdatePosition = false;
			//
			switch( name ){
				case 'disabled' :
					if( newValue==='disabled' || newValue === true || newValue === '' ){
						this._disabled = true;
					}else{
						this._disabled = false;
					}
					this.setDisabled( this._disabled );
				break;
				case 'value' :
					if( this._value != this.value ){
						isupdatePosition = true;
					}
				break;
				case 'start' :
					if( this._start != this.start ){
						isupdatePosition = true;
					}
				break;
			}
			//
			this.update( isupdatePosition );
		} }
	};
	
	var _dialProperties = $$.component.dialPrototype = (function(){
		
		var E_NAMES = m5c.core.event.utils.getEventNames(),
			PI = Math.PI,
			RAD = PI / 180,
			DEGREE = 180 / PI,
			CX = 103,
			CY = 130,
			S_DEGREE = 120,
			T_DEGREE = 300;
		//
		
		function getValue( ox, oy, total ){
			var x = ox - CX,
				y = oy - CY,
				d = Math.sqrt( (x*x) + (y*y) ),
				eRad = Math.acos(x/d);
				
			if( y < 0 ){
				eRad = (PI*2) - eRad;
			}
			
			var oDeg = ( eRad * DEGREE );
			if( oDeg < S_DEGREE ){
				oDeg += 360;
			}
			oDeg -= 120;
			
			return oDeg * total / T_DEGREE;
		};
		
		return {
			_wrap : {writable : true},
			_paper : {writable : true},
			_canvas : {writable : true},
			min : {
				set : function( v ){
					var val = parseFloat( v, 10 ) || 0;
					this.setAttribute('min', val);
				},
				get : function(){
					return parseFloat( this.getAttribute('min'), 10 ) || 0;
				}
			},
			max : {
				set : function( v ){
					var val = parseFloat( v, 10 ) || 0;
					this.setAttribute('max', val);
				},
				get : function(){
					return parseFloat( this.getAttribute('max'), 10 ) || 0;
				}
			},
			_value : {writable:true},
			value : {
				set : function( v ){
					var val = parseFloat( v, 10 ) || 0;
					this.setAttribute('value', val);
				},
				get : function(){
					return parseFloat( this.getAttribute('value'), 10 ) || 0;
				}
			},
			_total : {
				writable : true,
				value : 0
			},
			total : {
				set : function( v ){
					this._total = v;
				},
				get : function(){
					return this._total;
				}
			},
			_disabled : { writable: true  },
			disabled : {
				set : function( v ){
					this.setAttribute( 'disabled', v);
				},
				get : function(){
					return this.getAttribute( 'disabled' );
				}
			},
			init : {
				value : function(){
					this.uuid = m5c.component.getCreateElementUUID();
					this.initAttributes();
				}
			},
			create : {
				value : function(){
					var root = this.root;
					//
					this._wrap = root.querySelector('.m5c-dial');
					this._canvas = root.querySelector( '.m5c-dial-paper' );
					this._paper = this._canvas.getContext( '2d' );
					this.total = this.max - this.min;
						
					this.draw();
					
					if( !this._disabled ){
						this.setEvent();
					}
				}
			},
			draw : {
				value : function(){
					var ctx = this._paper,
						sRad = S_DEGREE * RAD,
						degree = S_DEGREE + T_DEGREE,
						eRad = degree * RAD,
						dotCx,
						dotCy,
						grad,
						enabled = !this._disabled;
					//
					
					degree = S_DEGREE + T_DEGREE;
					eRad = degree * RAD;
					
					//
					ctx.shadowColor = "rgba(0, 0, 0, 0)";
					ctx.shadowBlur = 0;
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 0;
					
					// gage line
					ctx.beginPath();
					ctx.strokeStyle = "#ededed";
					ctx.lineCap = "round";
					ctx.lineWidth = 10;
					ctx.arc( CX, CY, 83, sRad, eRad );
					ctx.stroke();
					ctx.closePath();
					
					if( enabled ){
						ctx.beginPath();
						grad = ctx.createLinearGradient(55, 0, 150, 0);
						grad.addColorStop(0, '#09abdb');
						grad.addColorStop(1, '#6dbf46');
						//
						degree = S_DEGREE + ( this.value *  T_DEGREE / this.total );
						eRad = degree * RAD;
						
						ctx.beginPath();
						ctx.arc( 103, 130, 83, sRad, eRad );
						ctx.strokeStyle = grad;
						ctx.lineWidth = 10;
						ctx.stroke();
						ctx.closePath();
					}
					
						
					// middle circle
					ctx.beginPath();
					grad = ctx.createLinearGradient(56, 211, 168, 65);
					grad.addColorStop( 0, enabled? '#c9cfda' : '#d8d8d8' );
					grad.addColorStop( 1, enabled? '#e4e8ef' : '#ededed' );
					ctx.fillStyle = grad;
					
					grad = ctx.createLinearGradient(56, 211, 168, 65);
					grad.addColorStop( 0, enabled? '#acb4c2' : '#c0c0c0' );
					grad.addColorStop( 1, '#eef1f7' );
					ctx.strokeStyle = grad;
					
					ctx.shadowBlur=3;
					ctx.shadowColor="rgba(0, 0, 0, 0.2)";
					ctx.shadowOffsetX = 0; 
					ctx.shadowOffsetY = 2;
					
					ctx.lineWidth = 4;
					
					ctx.arc( CX, CY, 76, 0, 2 * PI );
					ctx.stroke();
					ctx.fill();
					ctx.closePath();
					
					
					// small circle
					ctx.beginPath();
					grad = ctx.createLinearGradient(56, 211, 168, 65);
					grad.addColorStop( 0, enabled? '#c9cfda' : '#d6d6d6' );
					grad.addColorStop( 1, enabled? '#f7f9fa' : '#f9f9f9' );
					ctx.fillStyle = grad;
					
					grad = ctx.createLinearGradient(56, 211, 168, 65);
					grad.addColorStop( 0, enabled? '#bdbdbd' : '#c3c3c3' );
					grad.addColorStop( 1, '#fcfcfc' );
					ctx.strokeStyle = grad;
					
					ctx.shadowBlur=3;
					ctx.shadowColor="rgba(0, 0, 0, 0.2)";
					ctx.shadowOffsetX = 0; 
					ctx.shadowOffsetY = 2;
					
					ctx.lineWidth = 5;
					
					ctx.arc( CX, CY, 63, 0, 2 * PI );
					ctx.stroke();
					ctx.fill();
					ctx.closePath();
					
					
					// dot
					degree = S_DEGREE + ( this.value *  T_DEGREE / this.total );
					eRad = degree * RAD;
					dotCx = CX + ( Math.cos( eRad ) * 46 );
					dotCy = CY + ( Math.sin( eRad ) * 46 );
					
					//
					ctx.beginPath();
					ctx.arc( dotCx, dotCy, 7.5, 0, 2 * PI );
					ctx.fillStyle = enabled? '#67ecfc' : '#b6b6b6';
					if( enabled ){
						ctx.shadowBlur=9;
						ctx.shadowColor="rgba(40, 200, 219, 1)";
						ctx.shadowOffsetX = 0; 
						ctx.shadowOffsetY = 0;
					}
					ctx.fill();
					ctx.save();
					
					ctx.shadowBlur=2;
					ctx.shadowColor="rgba(0, 0, 0, 0.4)";
					ctx.shadowOffsetX = 0; 
					ctx.shadowOffsetY = -1;
					ctx.fill();
					
					ctx.restore();
					ctx.closePath();
				}
			},
			update : {
				value : function(){
					var ctx = this._paper,
						canvas = this._canvas;
					//
					ctx.beginPath();
					ctx.clearRect( 0, 0, canvas.width, canvas.height );
					ctx.closePath();
					//
					this.draw();
				}
			},
			setEvent : {
				value : function(){
					m5c.addEvent( this._canvas, E_NAMES.start, this, this.onStart );
				}
			},
			onStart : {
				value : function( e ){
					var x = e.offsetX - CX,
						y = e.offsetY - CY,
						d = Math.sqrt( (x*x) + (y*y) );
					//
					if( d > 15 &&  d < 76 ){
						//
						this._canvas.style.cursor = 'pointer';
						m5c.addEvent( this._canvas, E_NAMES.end, this, this.onEnd );
						m5c.addEvent( this._canvas, E_NAMES.move, this, this.onDragMove, {
							x : x,
							y : y,
							value : getValue( e.offsetX, e.offsetY, this.total ) - this.value
						} );
					}
						
				}
			},
			onEnd : {
				value : function(e){
					m5c.removeEvent( this._canvas, E_NAMES.end, this.onEnd );
					m5c.removeEvent( this._canvas, E_NAMES.move, this.onDragMove );
					this._canvas.style.cursor = 'default';
				}
			},
			onDragMove : {
				value : function( e, info ){
					var ctx = this._paper,
						x = e.offsetX - CX,
						y = e.offsetY - CY,
						d = Math.sqrt( (x*x) + (y*y) ),
						val = getValue( e.offsetX, e.offsetY, this.total ) - info.value;
					//
					
					if( d < 15 || d > 76 ){
						this.onEnd();
						return;
					}
					
					if( val < this.min ){
						val = this.min;
					}
					if( val > this.max ){
						val = this.max;
					}
					if( Math.abs( val - this.value )  < this.total/4  ){
						this.value = val;
					}
				}
			},
			setDisabled : {
				value : function( state ){
					if( state ){
						m5c.removeEvent( this._canvas, E_NAMES.start, this, this.onStart );
						this.onEnd();
					}else{
						this.setEvent();
					}
					this.update();
				}
			},
			initAttributes : {
				value : function(){
					//console.log( this.min, this.value, this.max, this.step, this.disabled );
					var disabled = this.getAttribute( 'disabled' );
					if( disabled==='disabled' || disabled === true || disabled === '' ){
						this._disabled = true;
					}else{
						this._disabled = false;
					}
					
					if( this.getAttribute( 'start' ) === null || isNaN( this.getAttribute( 'start' ) ) ){
						this._start = this.min;
						this.start = this.min;
					}
				}
			},
			onAttributeChangedCallback : { value : function( name, oldValue, newValue ){
				if( this.applyLifecycleCallback( 'attributeChangedCallback', arguments ) === false ){
					return;
				};
				//
				var isupdatePosition = false;
				//
				switch( name ){
					case 'disabled' :
						if( newValue==='disabled' || newValue === true || newValue === '' ){
							this._disabled = true;
						}else{
							this._disabled = false;
						}
						this.setDisabled( this._disabled );
					break;
				}
				//
				this.update( isupdatePosition );
			} }
			
		};
	}()); 
	
	var _toastProperties = $$.component.toastPrototype = {
		show : {
			value : function(){
				var root = this.root,
					dom = root.querySelector( '.m5c-toast' );
				//
				if( m5c.dom.hasClass( dom, 'show') ){
					return;
				}
				
				this.style.display = 'block';
				//
				m5c.removeEvent(dom, "transitionend" );
				
				if( m5c.dom.hasClass( dom, 'hidden' ) ){
					m5c.dom.removeClass( dom, 'hidden');
					dom.style.display = '';
				}
				if( dom.style.display === 'none' ){
					dom.style.display = '';
				}
				
				if( m5c.dom.hasClass( dom, 'hide' ) ){
					m5c.dom.removeClass( dom, 'hide');
				}
				
				setTimeout(function(){
					m5c.dom.addClass( dom, 'show');
				}, 20);
			}
		},
		hide : {
			value : function(){
				var root = this.root,
					dom = root.querySelector( '.m5c-toast' );
				//
				if( m5c.dom.hasClass( dom, 'hide') ){
					return;
				}
				
				if( dom.style.display == 'none' ){
					dom.style.display = '';
				}
				m5c.removeEvent(dom, "transitionend" );
				if( m5c.dom.hasClass( dom, 'show' ) ){
					m5c.dom.removeClass( dom, 'show');
				}
				
				m5c.dom.addClass( dom, 'hide');
				//
				m5c.addEvent(dom, "transitionend", function(){
					dom.style.display = 'none';
				}, true);
			}
		}
	};
	
	var _graphMonitorProperties = $$.component.graphMonitorProperties = {
		gageMax : {
			get : function(){
				return this.getAttribute( 'gage-max' );
			},
			set : function( v ){
				this.setAttribute( 'gage-max', v );
			}
		},
		gageMin : {
			get : function(){
				return this.getAttribute( 'gage-min' );
			},
			set : function( v ){
				this.setAttribute( 'gage-min', v );
			}
		},
		gageValue : {
			get : function(){
				return this.getAttribute( 'gage-value' );
			},
			set : function( v ){
				this.setAttribute( 'gage-value', v );
			}
		},
		_wrap : { writable:true },
		_canvas : { writable:true },
		_bbox : { writable:true },
		_paper : {
			writable : true
		},
		_imageData : {
			writable : true
		},
		_radius : {
			writable : true
		},
		_options : {
			writable : true,
			value : {
				radius : 70,
				innerRadius : 60,
				baseColor : '#f3f3f3',
				pointColor : '#219dd1',
				
				title : 'display',
				titleColor : '#bfc6cc',
				titleSize : 12,
				
				valueColor : '#219dd1',
				valueSize : 32
			}
		},
		get options(){
			return this._options;
		},
		set options( o ){
			this._options = o;
		},
		init : {
			value : function( options ){
				this.uuid = m5c.component.getCreateElementUUID();
				this.initAttributes();
				//
				var opts = this.options;
				if( typeof options === 'object' ){
					for( var key in opts ){
						if( options[key] !== undefined ){
							opts[key] = options[key];
						}
					}
				}
			}
		},
		initAttributes : {
			value : function(){
				//this.getAttribute('m5c-cmd')
				//this.getAttribute('connect')
				this.gageValue = this.getAttribute( 'gage-value' );
				this.gageMin = this.getAttribute( 'gage-min' );
				this.gageMax = this.getAttribute( 'gage-max' );
			}
		},
		create : {
			value : function(){
				var root = this.root,
					wrap = this._wrap = root.querySelector('.m5c-circle-monitor'),
					canvas = this._canvas = root.querySelector('.m5c-circle-monitor .paper'),
					ctx = this._paper =canvas.getContext( '2d' ),
					bbox = this._bbox = (function( elm ){
						var styles = window.getComputedStyle( elm, null );
						return {
							width : parseFloat( styles.getPropertyValue('width'), 10 ),
							height : parseFloat( styles.getPropertyValue('height'), 10 )
						};
					}( canvas ));
				//
				//wrap.appendChild( canvas );
				//
				m5c.addEvent( window, 'resize.'+this.uuid, this, this.onResize );
				this.update();
			}
		},
		onResize : {
			value : function(){
				this._imageData = null;
				this._bbox = (function( wrap ){
						var styles = window.getComputedStyle( wrap, null );
						return {
							width : parseFloat( styles.getPropertyValue('width'), 10 ),
							height : parseFloat( styles.getPropertyValue('height'), 10 )
						};
					}( this._wrap ));
				this._canvas.width = this._bbox.width;
				this._canvas.height = this._bbox.height;
				this._paper.clearRect( 0, 0, this._bbox.width, this._bbox.height );
				this.update();
			}
		},
		update : {
			value : function(){
				var root = this.root,
					wrap = root.querySelector('.m5c-circle-monitor'),
					canvas = document.createElement( 'canvas' ),
					ctx = null;
					
				var ctx = this._paper,
					opts = this.options,
					PI = Math.PI,
					RAD = PI / 180,
					sRad = 0,
					eRad = 2 * PI,
					cx = this._bbox.width/2,
					cy = this._bbox.height/2,
					r = opts.radius,
					r1 = opts.innerRadius,
					titleY = 13,
					valueY = 6,
					w = r - r1,
					total = this.gageMax - this.gageMin,
					value = this.gageValue,
					degree;
				//
				
				if( this._imageData ){
					ctx.putImageData( this._imageData, 0, 0 );
				}else{
					ctx.font = opts.titleSize + 'px Arial';
					ctx.fillStyle = opts.titleColor;
					ctx.textAlign = 'center';
					ctx.fillText( opts.title, cx, cy-titleY );
					//
					ctx.beginPath();
					ctx.strokeStyle = opts.baseColor;
					ctx.lineWidth = w;
					ctx.arc(cx, cy, r-(w/2), sRad, eRad, false);
					ctx.stroke();
					ctx.closePath();
					
					this._imageData = ctx.getImageData( 0, 0, this._bbox.width, this._bbox.height );
				}
				
				
				
				sRad = -90 * RAD;
				degree = -90 + ( 360 * (value/total) );
				eRad = degree * RAD;
				
				ctx.beginPath();
				ctx.strokeStyle = opts.pointColor;
				ctx.lineWidth = w;
				ctx.arc(cx, cy, r-(w/2), sRad, eRad, false);
				ctx.stroke();
				ctx.closePath();
				
				ctx.font = opts.valueSize + 'px Arial';
				ctx.fillStyle = opts.valueColor;
				ctx.textBaseline = 'top';
				ctx.textAlign = 'center';
				ctx.fillText( this.gageValue, cx, cy-valueY);
				
			}
		},
		onAttributeChangedCallback : { value : function( name, oldValue, newValue ){
			if( this.applyLifecycleCallback( 'attributeChangedCallback', arguments ) === false ){
				return;
			};
			//
			this.update();
		} }
	};
	
	/**
	 * chart
	 *  */
	$$.component.chart = (function(){
		
		var _math = Math;
		
		var inherit = function( c, p ){
			var copy = m5c.__clone( p ),
				target = m5c.__clone( c );
			//
			target['msupers'] = target['msupers'] || { writable: true, value : {} };
			for( var key in copy ){
				if( target[key] === undefined ){
					target[key] = copy[key];
				}else{
					target['msupers'].value[key] = copy[key].value;
				}
			}
			return target;
		};
		
		var MChart = {
			type : {
				value : 'chart'
			},
			_hasCategory : {writable:true, value : false},
			_hasValue : {writable:true, value : false},
			_container : {writable:true},
			container : {
				get : function(){
					return this._container;
				},
				set : function(v){
					this._container = v;
				}
			},
			_canvas : {writable:true},
			_paper : {writable:true},
			sWidth : {writable:true},
			sHeight : {writable:true},
			hasCategory : {writable:true},
			hasAxis : {writable:true},
			hasValue : {writable:true},
			categoryOptions : { writable : true, value : null },
			valueOptions : { writable : true, value : null },
			datas : { writable : true, value : null },
			options : { writable : true, value : null },
			fields : { writable : true, value : null },
			graphs : { writable : true, value : null },
			msuper : {
				value : function( fn ){
					var args = Array.prototype.slice.call( arguments, 1 );
					if( !!this.msupers ){
						if( typeof this.msupers[fn] === 'function' ){
							this.msupers[fn].apply( this, args );
						}
					}
				}
			},
			init : {
				value : function( option ){
					this.uuid = m5c.component.getCreateElementUUID();
					this.initAttributes();
					//
					var opts = {
						type: option.type || '',
						rotate: option.rotate,
						sync: false,
						isAnimated: option.isAnimated || false,
						sliceUnit: option.sliceUnit || 5,
						paddingLeft: option.paddingLeft || 0,
						paddingRight: option.paddingRight || 0,
						paddingTop: option.paddingTop || 0,
						paddingBottom: option.paddingBottom || 0
					},
					fields = {},
					tmpOpts,
					isrotated = option.rotate==90? true : false;
					
					//
					if( !!option.categoryAxis ){
						this._hasCategory = true;
						tmpOpts = opts.categoryAxis;
						this.categoryOptions + {
							labelSpace: (function(){
								if( !!tmpOpts.labelSpace ){
									return tmpOpts.labelSpace;
								}
								return 30;
							}()), // 라벨 공간,
							padding: tmpOpts.padding || 0, // 라벨, 라인 사이 여백
							borderWidth: tmpOpts.borderWidth || 1,  // (default) undefined || null === 사용안함 .
							borderColor: tmpOpts.borderColor || 'null', // (default)
							borderDashArray: tmpOpts.borderDashArray || '',
							lineColor: tmpOpts.lineColor || null,
							lineWidth: tmpOpts.lineWidth || 1,
							position: (function(){
								var ps;
								if( isrotated ){
									ps = tmpOpts.position=='right'? 'right' : 'left';
								}else{
									ps = tmpOpts.position=='top'? 'top' : 'bottom';
								}
								return ps;
							}()),
							fontFamily: tmpOpts.fontFamily || "Arial",
							fontSize: tmpOpts.fontSize || 13,
							fontWeight: tmpOpts.fontWeight || "bold",
							color: tmpOpts.color || "#b3b3b3",
							letterSpacing: tmpOpts.letterSpacing || 0,
							labelField: tmpOpts.labelField
						};
						if( !!tmpOpts.labelField ){
							if( fields[tmpOpts.labelField] === undefined ){
								fields[tmpOpts.labelField] = {};
							};
							if( fields[tmpOpts.labelField].type !== 'number' ){
								fields[tmpOpts.labelField].type = 'string';
							};
						}
					}
					
					tmpOpts = null;
					// Value Axis 설정.
					if( !!option.valueAxis ){
						this.hasValue = true;
						tmpOpts = option.valueAxis;
						this.valueOptions = {
							sliceCnt: tmpOpts.sliceCnt || 5, // 라벨 공간,
							labelSpace: tmpOpts.labelSpace || 30, // 라벨 공간,
							padding: tmpOpts.padding || 0, // 라벨, 라인 사이 여백
							borderWidth: tmpOpts.borderWidth || 1,  // (default) undefined || null === 사용안함 .
							borderColor: tmpOpts.borderColor || '#b3b3b3', // (default)
							lineColor: tmpOpts.lineColor || null,
							lineWidth: tmpOpts.lineWidth || 1,
							lineDashArray: tmpOpts.lineDashArray || '',
							position: (function(){
								var ps;
								if( isrotated ){
									ps = tmpOpts.position=='top'? 'top' : 'bottom';
								}else{
									ps = tmpOpts.position=='right'? 'right' : 'left';
								}
								return ps;
							}()),
							fontFamily: tmpOpts.fontFamily || "Arial",
							fontSize: tmpOpts.fontSize || 13,
							fontWeight: tmpOpts.fontWeight || "bold",
							color: tmpOpts.color || "#b3b3b3",
							labelField: tmpOpts.labelField
						};
						if( !!tmpOpts.labelField ){
							if( fields[tmpOpts.labelField] === undefined ){
								fields[tmpOpts.labelField] = {};
							};
							fields[tmpOpts.labelField].type = 'number';
						}
					}
					
					tmpOpts = null;
					
					if( !!option.graph && option.graph.length>0  ){
						for( var i=0, len=option.graph.length, graph; i<len; i+=1  ){
							graph = option.graph[i];
							if( !!graph.valueField ){
								if( fields[graph.valueField] === undefined ){
									fields[graph.valueField] = {};
								};
								fields[graph.valueField].type = 'number';
								fields[graph.valueField].min = graph.min;
								fields[graph.valueField].max = graph.max;
							}
							if( !!graph.labelField ){
								if( fields[graph.labelField] === undefined ){
									fields[graph.labelField] = {};
								};
								if( fields[graph.labelField].type !== 'number' ){
									fields[graph.labelField].type = 'string';
								};
							}
						}
						graph = null;
					}
					
					this.graphs = option.graph;
					this.options = opts;
					opts = null;
					
					// 데이터 저장.
					this.datas = option.dataProvider;
					this.parse( fields );
					
				}// value
			},
			parse : {
				value : function( o ){
					var that = this,
					odata = that.datas,
					sliceUnit = that.options.sliceUnit,
					fields = {};
					//
					var i, len, obj,  key="", val, uobj;
					for( i=0, len=odata.length; i<len;i+=1 ){
						obj = odata[i];
						//
						for( key in obj ){
							val = obj[key];
							uobj = fields[key];
							
							if( uobj===undefined ){
								uobj = {};
							}
							
							if( o[key] === undefined ){
								o[key] = { type : 'string' };
							}
							uobj.type = o[key].type;
							
							if( uobj.data===undefined ){
								uobj.data = [];
								if( uobj.type==='number' ){
									uobj.max =  o[key].max;
									uobj.min =  o[key].min;
								}
							}
							
							
							
							if( uobj.type === 'number' ){
								val = Number( val );
								if( uobj.min === undefined || uobj.min>val ){
									uobj.min = val;
								};
								if( uobj.max === undefined || uobj.max<val  ){
									uobj.max = val;
								};
							}
							
							uobj.data.push( val );
							
							//
							fields[key] = uobj;
							uobj = null;
						};
					};
					
					
					// minimum, maximum sliceUnit 기준으로 재정의.
					for( key in fields ){
						obj = fields[key];
						if( obj.type === 'number' ){
							val = obj.min;
							obj.min = _math.floor( val/sliceUnit ) * sliceUnit;
							val = obj.max;
							obj.max = _math.ceil( val/sliceUnit ) * sliceUnit;
						};
					};
					that.fields = fields;
					fields = null;
					//
					return this;
				}
			},
			draw : {
				value : function(){
					var root = this.root,
					canvas = this._canvas = document.createElement('canvas');
					//
					this.container = root.querySelector( '.m5c-chart' );
					canvas.width = this.offsetWidth;
					canvas.height = this.offsetHeight;
					this.container.appendChild(canvas);
					
					
					var style = window.getComputedStyle(this.parentNode);
					
					style = window.getComputedStyle(this);
					
					this._paper = this._canvas.getContext( '2d' );
				}
			}
		};
		
		
		var GraphBar = {
			init : {
				value : function( option ){
					this.msuper( 'init', option );
				}
			},
			initAttributes : {
				value : function(){}
			},
			draw : {
				value : function(){
					this.msuper( 'draw' );
					//console.log( this._paper );
				}
			},
			create : {
				value : function(){
					
				}
			},
		};
		
		var GraphPie = {
			init : {
				value : function( option ){
					this.msuper( 'init', option );
				}
			},
			initAttributes : {
				value : function(){}
			},
			draw : {
				value : function(){
					this.msuper( 'draw' );
				}
			},
			create : {
				value : function(){
					
				}
			},
		};
		
		var GraphLine = {
			init : {
				value : function( option ){
					this.msuper( 'init', option );
				}
			},
			initAttributes : {
				value : function(){}
			},
			draw : {
				value : function(){
					this.msuper( 'draw' );
				}
			},
			create : {
				value : function(){
					
				}
			},
		};
		
		var GraphSerial = {
			init : {
				value : function( option ){
					this.msuper( 'init', option );
				}
			},
			initAttributes : {
				value : function(){}
			},
			draw : {
				value : function(){
					this.msuper( 'draw' );
				}
			},
			create : {
				value : function(){
					
				}
			},
		};
		
		
		
		// export
		return {
			MChart : MChart,
			graphBarProperties :  inherit( GraphBar, MChart ),
			graphPieProperties : inherit( GraphPie, MChart ),
			graphLineProperties : inherit( GraphLine, MChart ),
			graphSerialProperties : inherit( GraphSerial, MChart )
		};
	}());
	
	
	var _chartProperties = $$.component.chart.MChart,
		_graphBarProperties = $$.component.chart.graphBarProperties,
		_graphPieProperties = $$.component.chart.graphPieProperties,
		_graphLineProperties = $$.component.chart.graphLineProperties,
		_graphSerialProperties = $$.component.chart.graphSerialProperties;
	
	
	
	$$.component.getPrototype = function( type, proto, superclass ){
		var csuper = superclass || HTMLElement;
		//
		if( proto === undefined ){
			switch( type.toLowerCase() ){
				case 'button' :
					proto = _buttonProperties;
				break;
				case 'toggle' :
					proto = _toggleProperties;
				break;
				case 'slider' :
					proto = _sliderProperties;
				break;
				case 'dial' :
					proto = _dialProperties;
				break;
				case 'toast' :
					proto = _toastProperties;
				break;
				case 'chart-bar' :
					proto = _graphBarProperties;
				break;
				case 'chart-pie' :
					proto = _graphPieProperties;
				break;
				case 'chart-line' :
					proto = _graphLineProperties;
				break;
				case 'chart-serial' :
					proto = _graphSerialProperties;
				break;
				case 'circle-monitor' :
					proto = _graphMonitorProperties;
				break;
				default :
					proto = m5c.__clone( _componentProperties );
					return Object.create( csuper.prototype, proto );
				break;
			};
		}
		proto = m5c.__clone( proto );
		// component의 속성을 추가한다.
		var comp = m5c.__clone( _componentProperties );
		for( var key in comp ){
			if( proto[key] === undefined ){
				proto[key] = comp[key];
			}
		}
		//
		return Object.create( csuper.prototype, proto );
	};
	
})();
