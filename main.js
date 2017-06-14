//====== Throttle for mouse move
function throttle(func, ms) {
	var isThrottled = false,
		savedArgs,
		savedThis;

	function wrapper() {
		if (isThrottled) { // (2)
			savedArgs = arguments;
			savedThis = this;
			return;
		}
		func.apply(this, arguments); // (1)
		isThrottled = true;
		setTimeout(function() {
			isThrottled = false; // (3)
			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}
	return wrapper;
}


//====== liquidBTN
function liquidBTN($btns) {
	//====== Vars
	let btnsObjectsArr = [],
		points = 8,
		viscosity = 10,
		mouseDist = 50,
		damping = 0.05,
		mouseX = 0,
		mouseY = 0,
		mouseLastX = 0,
		mouseLastY = 0,
		mouseDirectionX = 0,
		mouseDirectionY = 0,
		mouseSpeedX = 0,
		mouseSpeedY = 0;

	//====== Point
	function Point(x, y, level) {
		this.x = this.ix = 50 + x;
		this.y = this.iy = 50 + y;
		this.vx = 0;
		this.vy = 0;
		this.cx1 = 0;
		this.cy1 = 0;
		this.cx2 = 0;
		this.cy2 = 0;
		this.level = level;
	}

	Point.prototype.move = function(btnObj) {
		this.vx += (this.ix - this.x) / (viscosity * this.level);
		this.vy += (this.iy - this.y) / (viscosity * this.level);

		var dx = this.ix - btnObj.relMouseX,
			dy = this.iy - btnObj.relMouseY;
		var relDist = (1 - Math.sqrt((dx * dx) + (dy * dy)) / mouseDist);

		// Move x
		if ((mouseDirectionX > 0 && btnObj.relMouseX > this.x) || (mouseDirectionX < 0 && btnObj.relMouseX < this.x)) {
			if (relDist > 0 && relDist < 1) {
				this.vx = (mouseSpeedX / 4) * relDist;
			}
		}
		this.vx *= (1 - damping);
		this.x += this.vx;

		// Move y
		if ((mouseDirectionY > 0 && btnObj.relMouseY > this.y) || (mouseDirectionY < 0 && btnObj.relMouseY < this.y)) {
			if (relDist > 0 && relDist < 1) {
				this.vy = (mouseSpeedY / 4) * relDist;
			}
		}
		this.vy *= (1 - damping);
		this.y += this.vy;
	};

	//====== BtnObj
	function BtnObj(index, $btn) {
		this.index = index;
		this.$btn = $btn;
		this.bgColor = $btn.data('bgColor');
		this.fgColor = $btn.data('fgColor');
		this.canvas = null;
		this.$canvas = null;
		this.ctx = null;
		this.pointsA = [];
		this.pointsB = [];
		this.relMouseX = 0;
		this.relMouseY = 0;
	}

	//====== Get mouse direction
	function mouseDirection(e) {
		if (mouseX < e.pageX)
			mouseDirectionX = 1;
		else if (mouseX > e.pageX)
			mouseDirectionX = -1;
		else
			mouseDirectionX = 0;

		if (mouseY < e.pageY)
			mouseDirectionY = 1;
		else if (mouseY > e.pageY)
			mouseDirectionY = -1;
		else
			mouseDirectionY = 0;

		mouseX = e.pageX;
		mouseY = e.pageY;

		btnsObjectsArr.forEach((btnObject, index) => {
			btnObject.relMouseX = (mouseX - btnObject.$canvas.offset().left);
			btnObject.relMouseY = (mouseY - btnObject.$canvas.offset().top);
		});

	}

	//====== Get mouse speed
	function mouseSpeed() {
		mouseSpeedX = mouseX - mouseLastX;
		mouseSpeedY = mouseY - mouseLastY;

		mouseLastX = mouseX;
		mouseLastY = mouseY;

		setTimeout(mouseSpeed, 50);
	}
	mouseSpeed();

	//====== Init button
	function initButton(btnObj) {
		let $btn = btnObj.$btn,
			pointsA = btnObj.pointsA,
			pointsB = btnObj.pointsB;

		// Get button
		let buttonWidth = $btn.width(),
			buttonHeight = $btn.height();

		// Create canvas
		btnObj.$canvas = $('<canvas></canvas>');
		$btn.append(btnObj.$canvas);

		btnObj.canvas = btnObj.$canvas.get(0);
		btnObj.context = btnObj.canvas.getContext('2d');
		btnObj.canvas.width = buttonWidth + 100;
		btnObj.canvas.height = buttonHeight + 100;

		// Add points
		var x = buttonHeight / 2;
		for (var j = 1; j < points; j++) {
			addPoints(pointsA, pointsB, (x + ((buttonWidth - buttonHeight) / points) * j), 0);
		}
		addPoints(pointsA, pointsB, buttonWidth - buttonHeight / 5, 0);
		addPoints(pointsA, pointsB, buttonWidth + buttonHeight / 10, buttonHeight / 2);
		addPoints(pointsA, pointsB, buttonWidth - buttonHeight / 5, buttonHeight);
		for (var j = points - 1; j > 0; j--) {
			addPoints(pointsA, pointsB, (x + ((buttonWidth - buttonHeight) / points) * j), buttonHeight);
		}
		addPoints(pointsA, pointsB, buttonHeight / 5, buttonHeight);
		addPoints(pointsA, pointsB, -buttonHeight / 10, buttonHeight / 2);
		addPoints(pointsA, pointsB, buttonHeight / 5, 0);

		renderCanvas(btnObj);
	}

	function renderCanvas(btnObj) {
		// Clear scene
		btnObj.context.clearRect(0, 0, btnObj.$canvas.width(), btnObj.$canvas.height());
		btnObj.context.fillStyle = 'rgba(0,0,0, 0)';
		btnObj.context.fillRect(0, 0, btnObj.$canvas.width(), btnObj.$canvas.height());

		// Move points
		for (var i = 0; i <= btnObj.pointsA.length - 1; i++) {
			btnObj.pointsA[i].move(btnObj);
			btnObj.pointsB[i].move(btnObj);
		}

		// Draw shapes
		var groups = [btnObj.pointsA, btnObj.pointsB];

		for (var j = 0; j <= 1; j++) {
			var points = groups[j];
			if (j === 0) {
				// Background style
				btnObj.context.fillStyle = btnObj.bgColor;
			} else {
				// Foreground style
				btnObj.context.fillStyle = btnObj.fgColor;
			}

			btnObj.context.beginPath();
			btnObj.context.moveTo(points[0].x, points[0].y);

			for (var i = 0; i < points.length; i++) {
				var p = points[i];
				var nextP = points[i + 1];
				var val = 30 * 0.552284749831;

				if (nextP !== undefined) {
					p.cx1 = (p.x + nextP.x) / 2;
					p.cy1 = (p.y + nextP.y) / 2;
					p.cx2 = (p.x + nextP.x) / 2;
					p.cy2 = (p.y + nextP.y) / 2;

					btnObj.context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
				} else {
					nextP = points[0];
					p.cx1 = (p.x + nextP.x) / 2;
					p.cy1 = (p.y + nextP.y) / 2;

					btnObj.context.bezierCurveTo(p.x, p.y, p.cx1, p.cy1, p.cx1, p.cy1);
				}
			}
			btnObj.context.fill();
		}
	}

	//====== Add points
	function addPoints(pointsA, pointsB, x, y) {
		pointsA.push(new Point(x, y, 1));
		pointsB.push(new Point(x, y, 2));
	}

	//====== Init
	$btns.each(function(index) {
		let animationEndTimeout = null,
			animationInterval = null,
			$btn = $(this);
		// Create BtnObj
		let btnObj = new BtnObj(index, $btn);
		btnsObjectsArr.push(btnObj);
		// Init
		initButton(btnObj);
		let bindedRender = renderCanvas.bind(null, btnObj);
		$btn.on('mouseenter', (e) => {
			if (animationEndTimeout) clearTimeout(animationEndTimeout);
			if (animationInterval) clearInterval(animationInterval);
			animationInterval = setInterval(() => {
				requestAnimationFrame(bindedRender);
			}, 20);
		});
		$btn.on('mouseleave', (e) => {
			animationEndTimeout = setTimeout(() => {
				clearInterval(animationInterval);
			}, 3500);
		});
	});

	//====== Bind mousemove with throttling
	let mouseDataThrottled = throttle(mouseDirection, 70);
	$('body').on('mousemove', (e) => {
		mouseDataThrottled(e);
	});
}

liquidBTN($('.btn-liquid'));
