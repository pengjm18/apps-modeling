(function($){
	
	function Editor2D (canvas, options) 
	{
		var that = this;
		
		this.init = function ()
		{
			this.options = $.extend( {}, $.fn.editor2D.defaults, options );
			
			this.width = this.options.width;
			this.height = this.options.height;
			this.gridSize = this.options.gridSize;
			
			this.mode = 'CREATE';
			this.mouseButton = 'NONE';
			this.cursor = 'haircross';
			
			this.centerX = this.width / 2;
			this.centerY = this.height / 2;
			this.clickPosX = 0;
			this.clickPosY = 0;
			this.mousePosX = 0;
			this.mousePosY = 0;
			this.actPoint = 0;
			this.actOver = null;
			this.closed = false;
			this.points = [];
			
			this.canvas = canvas;
			this.canvas.width = this.options.width;
			this.canvas.height = this.options.height;
			
			//Add mousewheel handler (Chrome, Safari, Opera)
			this.canvas.addEventListener("mousewheel", this.mouseWheelListener);
			
			//Add mousewheel handler (Firefox)
			this.canvas.addEventListener("DOMMouseScroll", this.mouseWheelListener);
			
			//Add mouseup listener
			this.canvas.addEventListener('mouseup', this.mouseUpListener);
			
			//Add mousedown listener
			this.canvas.addEventListener('mousedown', this.mouseDownListener);
			
			//Add mousemove listener
			this.canvas.addEventListener('mousemove', this.mouseMoveListener);
			
			//Add mouseout listener
			this.canvas.addEventListener('mouseover', this.mouseOverListener, false);
			
			//Add mouseout listener
			this.canvas.addEventListener('mouseout', this.mouseOutListener, false);
			
			//Add contextmenu listener
			this.canvas.addEventListener('contextmenu', this.contextMenuListener, false);
			
			//Get the 2D-context
			this.context = this.canvas.getContext('2d');
			
			//Initial draw
			this.draw();
		};
		
		/*
		 * Handle the 'mouseup'-event
		 * @param {event} the fired mouse-event
		 */
		this.mouseUpListener = function (evt)
		{
			that.mouseButton = 'NONE';
			that.canvas.style.cursor = this.cursor;
			
			switch (evt.which) 
			{
				case 1: //LEFT
					if (that.mode == 'CREATE')
					{
						if (that.checkForClosing())
						{
							that.closePath();
						}
						else
						{
							that.addPoint();
						}
					}
				break;
				case 2: //MIDDLE
				break;
				case 3: //RIGHT
				break;
			}
			
		};
		
		/*
		 * Handle the 'mousedown'-event
		 * @param {event} the fired mouse-event
		 */
		this.mouseDownListener = function (evt)
		{
			//Update mouse position
			that.updateMousePos(evt)
			
			//Handle different mouse buttons
			switch (evt.which) 
			{
				case 1: 
					that.mouseButton = 'LEFT';
					that.clickPosX = that.mousePosX;
					that.clickPosY = that.mousePosY;  
					that.canvas.style.cursor = that.cursor;
					if (that.mode == 'EDIT')
					{
						that.selectPoint();	
					}
				break;
				case 2: 
					that.mouseButton = 'MIDDLE';
					that.clickPosX = that.mousePosX;
					that.clickPosY = that.mousePosY;
					that.canvas.style.cursor = 'move'; 
				break;
				case 3: 
					that.mouseButton = 'RIGHT';
					that.clickPosX = that.mousePosX;
					that.clickPosY = that.mousePosY; 
					that.canvas.style.cursor = 'pointer';
					that.endCreation();
				break;
			}
		};
		
		/*
		 * Handle the 'mousemove'-event
		 * @param {event} the fired mouse-event
		 */
		this.mouseMoveListener = function (evt)
		{
			//Update mouse position
			that.updateMousePos(evt);
			
			//Handle different mouse buttons
			switch (that.mouseButton) {
				case 'LEFT':
					if (that.mode == 'CREATE') 
					{
						that.updateControlPoint();
					}
					else if (that.mode == 'EDIT')
					{
						that.actPoint.x = that.mousePosX;
						that.actPoint.y = that.mousePosY;
					}
					break;
				case 'MIDDLE': 
					that.centerX -= that.clickPosX - that.mousePosX;
					that.centerY -= that.clickPosY - that.mousePosY;
					break;
				case 'RIGHT': 
					break;
				case 'NONE':
					if (that.mode == 'CREATE') 
					{
						if (that.checkForClosing())
						{
							that.points[that.points.length-1].x = that.points[0].x;
							that.points[that.points.length-1].y = that.points[0].y;
						}
						else
						{
							that.actPoint.x = that.mousePosX;
							that.actPoint.y = that.mousePosY;
						}
					}
					else if (that.mode == 'EDIT') 
					{
						that.checkOverOut();
					}
					break;				
			}
			
			that.draw();
		};
		
		/*
		 * Handle the 'mousewheel'-event
		 * @param {event} the fired mouse-event
		 */
		this.mouseWheelListener = function (evt)
		{
			//Update mouse position
			that.updateMousePos(evt)
			
			//Check for up- or down-scroll
			if (evt.wheelDelta > 0 || evt.detail > 0) 
			{
				//If allowed increment grid size and redraw it
				if (that.gridSize < that.options.gridMax) 
				{
					that.gridSize += that.options.gridStep;
					that.draw();
				}
			} 
			else 
			{
				//If allowed decrement grid size and redraw it
				if (that.gridSize > that.options.gridMin) 
				{
					that.gridSize -= that.options.gridStep;
					that.draw();
				}
			}
		};
		
		/*
		 * Handle 'mouseover'-event
		 * @param {event} the fired mouse-event
		 */
		this.mouseOverListener = function (evt) 
		{
			if (that.mode == 'CREATE')
			{
				that.addPoint();
				that.draw();
			}
		}
		
		/*
		 * Handle 'mouseout'-event
		 * @param {event} the fired mouse-event
		 */
		this.mouseOutListener = function (evt) 
		{	
			if (that.mode == 'CREATE')
			{
				that.points.pop();
				that.draw();
			}
		}
		
		/*
		 * Handle 'contextmenu'-event
		 * Disables the default contextmenu
		 * @param {event} the fired mouse-event
		 */
		this.contextMenuListener = function (evt)
		{
			evt.preventDefault();
			return false;
		};
		
		
		/*
		 * 
		 * @param {mode} 
		 */
		this.changeMode = function (mode) 
		{
			this.mode = mode;
			switch (mode)
			{
				case 'CREATE':
					this.cursor = 'haircross';
					this.canvas.style.cursor = 'haircross';
					break;
				case 'EDIT':
					this.cursor = 'default';
					this.canvas.style.cursor = 'default';
					break;	
			}
		};
		
		/*
		 * Updates the actual saved mouse position
		 * @param {event} the fired mouse-event
		 */
		this.updateMousePos = function (evt) 
		{
			var rect = that.canvas.getBoundingClientRect();
			that.mousePosX = (evt.clientX - rect.left - this.centerX - 2) / that.gridSize;
			that.mousePosY = (evt.clientY - rect.top - this.centerY - 2.5) / that.gridSize;	
		};
		
		/*
		 * 
		 */
		this.endCreation = function()
		{
			//Loop over all points
			if (this.mode == 'CREATE' && this.points.length > 3)
			{
				//Switch to edit-mode
				this.mode = 'EDIT';
				
				//Delete last point
				this.points.pop();
			}
		};
		
		/*
		 * @return {boolean} 
		 */
		this.checkForClosing = function()
		{
			//Loop over all points
			if (this.mode == 'CREATE' && this.points.length > 3)
			{
				var distance = Math.pow(this.points[0].x - this.mousePosX, 2) + Math.pow(this.points[0].y - this.mousePosY, 2);
				return (distance <= 0.25);
			}
		};
		
		/*
		 * @return {boolean} 
		 */
		this.selectPoint = function()
		{
			this.unselectPoints();
			if (this.actOver !== null)
			{
				this.actOver.selected = true;
				this.actPoint = this.actOver;
			}
		};
		
		/*
		 * @return {boolean} 
		 */
		this.checkOverOut = function()
		{
			for (var p=0; p<this.points.length; p++)
			{
				var distance = Math.pow(this.points[p].x - this.mousePosX, 2) + Math.pow(this.points[p].y - this.mousePosY, 2);
				if (distance <= 0.05)
				{
					this.points[p].over = true;
					this.actOver = this.points[p];
					return;
				}
				else
				{
					this.points[p].over = false;
					this.actOver = null;
				}
				
				for (var c=0; c<this.points[p].control.length; c++)
				{
					var distance = Math.pow(this.points[p].control[c].x - this.mousePosX, 2) + Math.pow(this.points[p].control[c].y - this.mousePosY, 2);
					if (distance <= 0.02)
					{
						this.points[p].control[c].over = true;
						this.actOver = this.points[p].control[c];
						return;
					}
					else
					{
						this.points[p].control[c].over = false;
						this.actOver = null;
					}
				}
			}
		};
		
		/*
		 * 
		 */
		this.closePath = function()
		{
			//Check if allowed to close the path
			if (this.mode == 'CREATE' && this.points.length > 3)
			{
				//Switch to 'EDIT'-mode
				this.changeMode('EDIT');
				
				//Unselect all points
				this.unselectPoints();
				
				this.closed = true;
				
				this.points.pop();
			}
		};
		
		/*
		 * 
		 */
		this.unselectPoints = function()
		{
			//Loop over all points
			for (var p=0; p<this.points.length; p++)
			{
				this.points[p].selected = false;
				
				for (var c=0; c<this.points[p].control.length; c++)
				{
					this.points[p].control[c].selected = false;
				}
			}
		};
		
		/*
		 * 
		 */
		this.updateControlPoint = function()
		{
			if (this.actPoint.control.length == 0) 
			{
				this.actPoint.control.push({x: 0, y: 0, parent: this.actPoint, over: false, selected: false});
				this.actPoint.control.push({x: 0, y: 0, parent: this.actPoint, over: false, selected: false});
			}
			
			var dirVecX = this.mousePosX - this.actPoint.x;
			var dirVecY = this.mousePosY - this.actPoint.y;
			
			this.actPoint.control[0].x = this.actPoint.x + dirVecX;
			this.actPoint.control[0].y = this.actPoint.y + dirVecY;
			
			this.actPoint.control[1].x = this.actPoint.x - dirVecX;
			this.actPoint.control[1].y = this.actPoint.y - dirVecY;
		};
		
		/*
		 * Create a new point at actual mouse position
		 */
		this.addPoint = function()
		{
			//Check if mode is CREATE
			if (this.mode == 'CREATE')
			{
				//First unselect all Points
				this.unselectPoints();
				
				//Create new Point
				var point = {};
				
				//Set Point properties
				point.x = this.mousePosX;
				point.y = this.mousePosY;
				point.control = [];
				point.over = false;
				point.selected = true;
				
				//Add point to list
				this.points.push(point);
				
				//Set actual point
				this.actPoint = point;
			}
		};
		
		/*
		 * Clear the canvas and draw the grid, points and lines
		 */
		this.draw = function()
		{
			//Clear the canvas before next draw
			this.context.clearRect(0, 0, this.width, this.height);
			
			//Draw the grid
			this.drawGrid();
			
			//Draw the lines
			this.drawLines();
			
			//Draw conrol lines
			this.drawControlLines();
			
			//Draw the points
			this.drawPoints();
			
			this.drawControlPoints();
		};
		
		/*
		 * Draw the whole grid
		 */
		this.drawGrid = function () 
		{	
			//Start new path for grid lines
			this.context.beginPath();
			
			//Set line width and color
			this.context.lineWidth = 1;
			this.context.strokeStyle = '#777';
	
			//Create vertical lines right from centerpoint
			for (var x = this.centerX + this.gridSize; x <= this.width; x += this.gridSize) {
				this.context.moveTo(x, 0);
				this.context.lineTo(x, this.height);
			}
			
			//Create vertical lines left from centerpoint
			for (x = this.centerX - this.gridSize; x >= 0; x -= this.gridSize) {
				this.context.moveTo(x, 0);
				this.context.lineTo(x, this.height);
			}
			
			//Create horizontal lines top from centerpoint
			for (var y = this.centerY + this.gridSize; y <= this.height; y += this.gridSize) {
				this.context.moveTo(0, y);
				this.context.lineTo(this.width, y);
			}
			
			//Create horizontal lines bottom from centerpoint
			for (var y = this.centerY - this.gridSize; y >= 0; y -= this.gridSize) {
				this.context.moveTo(0, y);
				this.context.lineTo(this.width, y);
			}
			
			//Draw it!
			this.context.stroke();
			
			//Start new path for center lines
			this.context.beginPath();
			
			//Set line width and color
			this.context.lineWidth = 2;
			this.context.strokeStyle = this.options.gridColor;
			
			//Create vertical center line
			this.context.moveTo(this.centerX, 0);
			this.context.lineTo(this.centerX, this.height);
			
			//Create horizontal center line
			this.context.moveTo(0, this.centerY);
			this.context.lineTo(this.width, this.centerY);
			
			//Draw it!
			this.context.stroke();
		};
		
		/*
		 * Draw the lines and curves between the points
		 */
		this.drawLines = function()
		{
			//Loop over all points
			for (var p=1; p<this.points.length; p++)
			{
				this.drawLine(p-1, p);
			}
			
			if (this.closed)
			{
				this.drawLine(this.points.length-1, 0);
			}
		};
		
		/*
		 * Draw a single line or curve between two points
		 */
		this.drawLine = function(p1, p2)
		{
			//Start new path for every line
			this.context.beginPath();
			
			//Set line width and color
			this.context.lineWidth = 2;
			this.context.strokeStyle = this.options.lineColor;
			
			var startPointX = this.points[p1].x * this.gridSize + this.centerX;
			var startPointY = this.points[p1].y * this.gridSize + this.centerY;
			
			var endPointX = this.points[p2].x * this.gridSize + this.centerX;
			var endPointY = this.points[p2].y * this.gridSize + this.centerY;
			
			if (this.points[p1].control.length != 0)
			{
				var controlPointX_1 = this.points[p1].control[0].x * this.gridSize + this.centerX;
				var controlPointY_1 = this.points[p1].control[0].y * this.gridSize + this.centerY;
			} 
			else
			{
				var controlPointX_1 = startPointX;
				var controlPointY_1 = startPointY;
			}
			
			if (this.points[p2].control.length != 0)
			{
				var controlPointX_2 = this.points[p2].control[1].x * this.gridSize + this.centerX;
				var controlPointY_2 = this.points[p2].control[1].y * this.gridSize + this.centerY;
			} 
			else
			{
				var controlPointX_2 = endPointX;
				var controlPointY_2 = endPointY;
			}
			
			this.context.moveTo(startPointX, startPointY);
			this.context.bezierCurveTo(controlPointX_1, controlPointY_1, controlPointX_2, controlPointY_2, endPointX, endPointY);
			
			//Draw it!
			this.context.stroke();
		};
		
		/*
		 * Draw the points
		 */
		this.drawPoints = function () 
		{
			//Loop over all points
			for (var p=0; p<this.points.length; p++)
			{			
				//Start new path for every point
				this.context.beginPath();
				
				//Set point color
				this.context.fillStyle = (this.points[p].selected) ? this.options.selectColor : this.options.pointColor;
				
				//Create actual point
				this.context.arc(this.points[p].x * this.gridSize + this.centerX, this.points[p].y * this.gridSize + this.centerY, this.gridSize/4, 0, Math.PI*2, false); 
				
				//Close the path
				this.context.closePath();
				
				//Draw it!
				this.context.fill();
				
				if (this.points[p].over)
				{
					//Start new path for every point
					this.context.beginPath();
					
					//Set line width and color
					this.context.lineWidth = 1;
					this.context.strokeStyle = '#CCC';
					
					//Create actual point
					this.context.arc(this.points[p].x * this.gridSize + this.centerX, this.points[p].y * this.gridSize + this.centerY, this.gridSize/3, 0, Math.PI*2, false); 
				
					//Close the path
					this.context.closePath();
				
					//Draw it!
					this.context.stroke();
				}
			}
		};
		
		/*
		 * Draw the points
		 */
		this.drawControlPoints = function () 
		{
			//Loop over all points
			for (var p=0; p<this.points.length; p++)
			{	
				for (c=0; c<this.points[p].control.length; c++)
				{		
					//Start new path for every point
					this.context.beginPath();
					
					//Set point color
					this.context.fillStyle = (this.points[p].control[c].selected) ? this.options.selectColor : this.options.handleColor;
					
					//Create actual point
					this.context.arc(this.points[p].control[c].x * this.gridSize + this.centerX, this.points[p].control[c].y * this.gridSize + this.centerY, this.gridSize/6, 0, Math.PI*2, false); 
					
					//Close the path
					this.context.closePath();
					
					//Draw it!
					this.context.fill();
					
					if (this.points[p].control[c].over)
					{
						//Start new path for every point
						this.context.beginPath();
						
						//Set line width and color
						this.context.lineWidth = 1;
						this.context.strokeStyle = '#CCC';
						
						//Create actual point
						this.context.arc(this.points[p].control[c].x * this.gridSize + this.centerX, this.points[p].control[c].y * this.gridSize + this.centerY, this.gridSize/4, 0, Math.PI*2, false); 
					
						//Close the path
						this.context.closePath();
					
						//Draw it!
						this.context.stroke();
					}
				}
			}
		};
		
		/*
		 * Draw the control lines
		 */
		this.drawControlLines = function () 
		{
			//Loop over all points
			for (var p=0; p<this.points.length; p++)
			{	
				for (c=0; c<this.points[p].control.length; c++)
				{
					//Start new path for every line
					this.context.beginPath();
					
					//Set line width and color
					this.context.lineWidth = 1;
					this.context.strokeStyle = this.options.lineColor;
					
					//Create line between the actual and the previous point
					this.context.moveTo(this.points[p].x * this.gridSize + this.centerX, this.points[p].y * this.gridSize + this.centerY);
					this.context.lineTo(this.points[p].control[c].x * this.gridSize + this.centerX, this.points[p].control[c].y * this.gridSize + this.centerY);
					
					//Draw it!
					this.context.stroke();
				}
			}
		};
		
		
		//Finaly initialize the editor
		this.init();
    };
	
	Editor2D.prototype = {
		reset: function() 
		{
			this.points = [];
			this.centerX = this.width/2;
			this.centerY = this.height/2;
			this.gridSize = 30;
			this.draw();
		},
		
		mode: function(mode) 
		{
			this.changeMode(mode);
		}
	};
	
	$.fn.editor2D = function(options)
	{
		// slice arguments to leave only arguments after function name
        var args = Array.prototype.slice.call(arguments, 1);
		
        return this.each(function() {
            var item = $(this)
			var instance = item.data('Editor2D');
            if(!instance) 
			{
                // create plugin instance and save it in data
                item.data('Editor2D', new Editor2D(this, options));
            } 
			else 
			{
                // if instance already created call method
                if(typeof options === 'string') 
				{
                    instance[options].apply(instance, args);
                }
            }
        });	
	};
	
	// Plugin defaults – added as a property on our plugin function.
	$.fn.editor2D.defaults = {
    	width: 600,
    	height: 400,
		gridSize: 30,
		gridMin: 1,
		gridMax: 100,
		gridStep: 5,
		gridColor: '#CCC',
		lineColor: '#CCC',
		handleColor: '#CCC',
		pointColor: '#2956a8',
		selectColor: '#dd3500'
	};
	

	
})(jQuery);