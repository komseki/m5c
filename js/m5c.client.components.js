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
					fields = null;
					console.log( this.fields );
					
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
					var root = this.root;
					this.container = root.querySelector( '.m5c-chart' );
					this._canvas = document.createElement('canvas');
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
