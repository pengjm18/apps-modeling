/*
 * 
 */
function Snapping()
{	
	var observer =
	{
		angList: {
			observerList: []
		},
		
		subscribe: function(fn, type)
		{
			type = type || 'observerList';
			
			if(typeof this.angList[type] === 'undefined')
			{
				this.angList[type] = [];	
			}
			
			this.angList[type].push(fn);
		},
		
		unsubscribe: function(fn, type)
		{
			var subType = type || 'observerList',
				angList = this.angList[subType],
				max = angList.length,
				i;
			
			for(i = 0; i < max; i+=1)
			{
				if(angList[i] === fn)
				{
					angList.splice(i, 1);
				}
			}
		},
		
		publish: function(fn, type)
		{
			
		}
	};
	
	
	/* set und get der Position der Elemente
    ui.BBTransX.set(pos.x.toFixed(3));
    ui.BBTransY.set(pos.y.toFixed(3));
    ui.BBTransZ.set(pos.z.toFixed(3));

    ui.BBTransX.get();
    ui.BBTransY.get();
    ui.BBTransZ.get();   
	*/
	
	this.init = function()
	{
		/* ID actual element */
		var actualID;
		
		var distance;
		
		/* IDs all elements in view */
		var objListID = [];
		
		/* Json File from primitive */
		var pfad = './x3d/JsonFiles/Box.json';
		
		actualID = primitiveManager.getActualPrimitive();
		objListID = primitiveManager.getIDList();		
		
		for(var i = 0; i < objListID.length; i++)
		{
			loadJSON(objListID[i], pfad);
		}
		
		
		/* calculated distance */
		distance = pointsDistance(primitiveManager.getPosition(objListID[0]), primitiveManager.getPosition(objListID[1]));
		console.log("distance: " + distance);
	};
	
	
	/*
	 * calculate distance
	 * @return distance between two points
	 */
	function pointsDistance(point1, point2)
	{
		var distance;
		
		var summ = ((point1.x - point2.x) * 2) + ((point1.y - point2.y) * 2) + ((point1.z - point2.z) * 2);
		
		console.log("summ: " + summ);
		
		if(summ < 0)
		{
			summ = summ * (-1);
			distance = Math.sqrt(summ);
		}
		if(summ == 0)
		{
			distance = summ;
		}
		else
		{
			distance = Math.sqrt(summ);
		}
		
		console.log("distance: " + distance);
		
		return distance;
	};
	
	
	/* Draws the direction axis */
    function positionAxis(id, pfad, position)
    {    	
    	var transform = document.createElement('Transform');
    	var transform_S = document.createElement('Shape');
    	var transform_S_A = document.createElement('Appearance');
    	var transform_S_A_M = document.createElement('Material');    	
    	var transform_S_A_M_S = document.createElement('Sphere');
    	
    	transform_S_A_M_S.setAttribute('radius', '0.025');
    	transform_S_A_M.setAttribute('diffuseColor', '#3FFFFF');
    	transform.setAttribute('translation', position);
    	transform.setAttribute('id', 'boundingPoint');
    	
    	transform_S_A.appendChild( transform_S_A_M );
    	transform_S.appendChild( transform_S_A_M_S );
    	transform_S.appendChild( transform_S_A );
    	transform.appendChild( transform_S );
    	
    	var element = document.getElementById('mt_' + id);
    	element.appendChild(transform);
    };
    
    /* Draws the normal */
    function directionNormale(id, pfad, position)
    {		
		/* Cylinder */	
    	var transform = document.createElement('Transform');
    	var transform_S = document.createElement('Shape');
    	var transform_S_A = document.createElement('Appearance');
    	var transform_S_A_M = document.createElement('Material');    	
    	var transform_S_A_M_S = document.createElement('Cylinder');
    	
    	transform_S_A_M_S.setAttribute('radius', '0.005');
    	transform_S_A_M_S.setAttribute('height', '1.0');
    	    	    	
    	transform_S_A_M.setAttribute('diffuseColor', '#3FFFFF');
    	transform.setAttribute('rotation', '0 0 1 -1.57079');
    	transform.setAttribute('translation', position);
    	transform.setAttribute('id', 'normale');

    	transform_S_A.appendChild( transform_S_A_M );
    	transform_S.appendChild( transform_S_A_M_S );    	
    	transform_S.appendChild( transform_S_A );
    	transform.appendChild( transform_S );
    	
    	
    	/* Cone */
    	var transform2 = document.createElement('Transform');
    	var transform_S2 = document.createElement('Shape');
    	var transform_S_A2 = document.createElement('Appearance');
    	var transform_S_A_M2 = document.createElement('Material');    	
    	var transform_S_A_M_S2 = document.createElement('Cone');
    	
    	transform_S_A_M_S2.setAttribute('height', '0.05');
    	transform_S_A_M_S2.setAttribute('bottomRadius', '0.05');
    	    	    	
    	transform_S_A_M2.setAttribute('diffuseColor', '#3FFFFF');
    	transform2.setAttribute('rotation', '0 0 1 -1.57079');
    	transform2.setAttribute('translation', '1.5 0 0');
    	transform2.setAttribute('id', 'normale');

    	transform_S_A2.appendChild( transform_S_A_M2 );
    	transform_S2.appendChild( transform_S_A_M_S2 );    	
    	transform_S2.appendChild( transform_S_A2 );
    	transform2.appendChild( transform_S2 );
    	
    	
    	var element = document.getElementById('mt_' + id);
    	element.appendChild(transform2);
    	element.appendChild(transform);
    };
    
	function loadJSON(id, pfad)
    {
	    // json-string load
		var json = GetHttpText(pfad);
		
		// make a string from array
		var jsonObj = eval ('(' + json + ')');
		
		// the array can be accessed as follows points[0]
		var points = jsonObj.snapPoints;		
		
		for(var i = 0; i < points.length-1; i++)
		{
			// Create direction axis
			positionAxis(id, pfad, points[i].toString());
		}
		
		for(var i = points.length-1; i < points.length; i++)
		{
			// Create normale
			directionNormale(id, pfad, points[i].toString());
		}
    };

	
	function GetHttpText(url) 
	{
		if (window.XMLHttpRequest) 
		{
			vHTTPReq = new XMLHttpRequest();
		}
		else 
		{
			vHTTPReq = new ActiveXObject("Microsoft.XMLHTTP"); // IE 5 / 6
		}
	
		/// get content
		vHTTPReq.open("GET", url, false);
		vHTTPReq.send();
	
		return vHTTPReq.responseText;
	};
}
