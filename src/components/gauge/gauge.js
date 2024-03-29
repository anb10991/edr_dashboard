//import 'jquery';

import $ from 'jquery';
var AnimatedText, AnimatedTextFactory, Bar, BaseDonut, BaseGauge, Donut, Gauge, GaugePointer, TextRenderer, ValueUpdater, addCommas, cutHex, formatNumber, mergeObjects, secondsToString,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) {
        for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }

        function ctor() { this.constructor = child; }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };
(function() {
    var browserRequestAnimationFrame, isCancelled, lastId, vendor, vendors, _i, _len;
    vendors = ['ms', 'moz', 'webkit', 'o'];
    for (_i = 0, _len = vendors.length; _i < _len; _i++) {
        vendor = vendors[_i];
        if (window.requestAnimationFrame) {
            break;
        }
        window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
    }
    browserRequestAnimationFrame = null;
    lastId = 0;
    isCancelled = {};
    if (!requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime, id, lastTime, timeToCall;
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(function() {
                return callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        return window.cancelAnimationFrame = function(id) {
            return clearTimeout(id);
        };
    } else if (!window.cancelAnimationFrame) {
        browserRequestAnimationFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback, element) {
            var myId;
            myId = ++lastId;
            browserRequestAnimationFrame(function() {
                if (!isCancelled[myId]) {
                    return callback();
                }
            }, element);
            return myId;
        };
        return window.cancelAnimationFrame = function(id) {
            return isCancelled[id] = true;
        };
    }
})();

secondsToString = function(sec) {
    var hr, min;
    hr = Math.floor(sec / 3600);
    min = Math.floor((sec - (hr * 3600)) / 60);
    sec -= (hr * 3600) + (min * 60);
    sec += '';
    min += '';
    while (min.length < 2) {
        min = '0' + min;
    }
    while (sec.length < 2) {
        sec = '0' + sec;
    }
    hr = hr ? hr + ':' : '';
    return hr + min + ':' + sec;
};

formatNumber = function() {
    var digits, num, value;
    num = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    value = num[0];
    digits = 0 || num[1];
    return addCommas(value.toFixed(digits));
};

mergeObjects = function(obj1, obj2) {
    var key, out, val;
    out = {};
    for (key in obj1) {
        if (!__hasProp.call(obj1, key)) continue;
        val = obj1[key];
        out[key] = val;
    }
    for (key in obj2) {
        if (!__hasProp.call(obj2, key)) continue;
        val = obj2[key];
        out[key] = val;
    }
    return out;
};

addCommas = function(nStr) {
    var rgx, x, x1, x2;
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = '';
    if (x.length > 1) {
        x2 = '.' + x[1];
    }
    rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};

cutHex = function(nStr) {
    if (nStr.charAt(0) === "#") {
        return nStr.substring(1, 7);
    }
    return nStr;
};

ValueUpdater = (function() {
    ValueUpdater.prototype.animationSpeed = 32;

    function ValueUpdater(addToAnimationQueue, _at_clear) {
        if (addToAnimationQueue == null) {
            addToAnimationQueue = true;
        }
        this.clear = _at_clear != null ? _at_clear : true;
        if (addToAnimationQueue) {
            AnimationUpdater.add(this);
        }
    }

    ValueUpdater.prototype.update = function(force) {
        var diff;
        if (force == null) {
            force = false;
        }
        if (force || this.displayedValue !== this.value) {
            if (this.ctx && this.clear) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            diff = this.value - this.displayedValue;
            if (Math.abs(diff / this.animationSpeed) <= 0.001) {
                this.displayedValue = this.value;
            } else {
                this.displayedValue = this.displayedValue + diff / this.animationSpeed;
            }
            this.render();
            return true;
        }
        return false;
    };

    return ValueUpdater;

})();

BaseGauge = (function(_super) {
    __extends(BaseGauge, _super);

    function BaseGauge() {
        return BaseGauge.__super__.constructor.apply(this, arguments);
    }

    BaseGauge.prototype.displayScale = 1;

    BaseGauge.prototype.forceUpdate = true;

    BaseGauge.prototype.setTextField = function(textField, fractionDigits) {
        return this.textField = textField instanceof TextRenderer ? textField : new TextRenderer(textField, fractionDigits);
    };

    BaseGauge.prototype.setMinValue = function(_at_minValue, updateStartValue) {
        var gauge, _i, _len, _ref, _results;
        this.minValue = _at_minValue;
        if (updateStartValue == null) {
            updateStartValue = true;
        }
        if (updateStartValue) {
            this.displayedValue = this.minValue;
            _ref = this.gp || [];
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                gauge = _ref[_i];
                _results.push(gauge.displayedValue = this.minValue);
            }
            return _results;
        }
    };

    BaseGauge.prototype.setOptions = function(options) {
        if (options == null) {
            options = null;
        }
        this.options = mergeObjects(this.options, options);
        if (this.textField) {
            this.textField.el.style.fontSize = options.fontSize + 'px';
        }
        if (this.options.angle > .5) {
            this.options.angle = .5;
        }
        this.configDisplayScale();
        return this;
    };

    BaseGauge.prototype.configDisplayScale = function() {
        var backingStorePixelRatio, devicePixelRatio, height, prevDisplayScale, width;
        prevDisplayScale = this.displayScale;
        if (this.options.highDpiSupport === false) {
            delete this.displayScale;
        } else {
            devicePixelRatio = window.devicePixelRatio || 1;
            backingStorePixelRatio = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
            this.displayScale = devicePixelRatio / backingStorePixelRatio;
        }
        if (this.displayScale !== prevDisplayScale) {
            width = this.canvas.G__width || this.canvas.width;
            height = this.canvas.G__height || this.canvas.height;
            this.canvas.width = width * this.displayScale;
            this.canvas.height = height * this.displayScale;
            this.canvas.style.width = width + "px";
            this.canvas.style.height = height + "px";
            this.canvas.G__width = width;
            this.canvas.G__height = height;
        }
        return this;
    };

    BaseGauge.prototype.parseValue = function(value) {
        value = parseFloat(value) || Number(value);
        if (isFinite(value)) {
            return value;
        } else {
            return 0;
        }
    };

    return BaseGauge;

})(ValueUpdater);

TextRenderer = (function() {
    function TextRenderer(_at_el, _at_fractionDigits) {
        this.el = _at_el;
        this.fractionDigits = _at_fractionDigits;
    }

    TextRenderer.prototype.render = function(gauge) {
        return this.el.innerHTML = formatNumber(gauge.displayedValue, this.fractionDigits);
    };

    return TextRenderer;

})();

AnimatedText = (function(_super) {
    __extends(AnimatedText, _super);

    AnimatedText.prototype.displayedValue = 0;

    AnimatedText.prototype.value = 0;

    AnimatedText.prototype.setVal = function(value) {
        return this.value = 1 * value;
    };

    function AnimatedText(_at_elem, _at_text) {
        this.elem = _at_elem;
        this.text = _at_text != null ? _at_text : false;
        AnimatedText.__super__.constructor.call(this);
        if (this.elem === void 0) {
            throw new Error('The element isn\'t defined.');
        }
        this.value = 1 * this.elem.innerHTML;
        if (this.text) {
            this.value = 0;
        }
    }

    AnimatedText.prototype.render = function() {
        var textVal;
        if (this.text) {
            textVal = secondsToString(this.displayedValue.toFixed(0));
        } else {
            textVal = addCommas(formatNumber(this.displayedValue));
        }
        return this.elem.innerHTML = textVal;
    };

    return AnimatedText;

})(ValueUpdater);

AnimatedTextFactory = {
    create: function(objList) {
        var elem, out, _i, _len;
        out = [];
        for (_i = 0, _len = objList.length; _i < _len; _i++) {
            elem = objList[_i];
            out.push(new AnimatedText(elem));
        }
        return out;
    }
};

GaugePointer = (function(_super) {
    __extends(GaugePointer, _super);

    GaugePointer.prototype.displayedValue = 0;

    GaugePointer.prototype.value = 0;

    GaugePointer.prototype.options = {
        strokeWidth: 0.035,
        length: 0.1,
        color: "#000000",
        iconPath: null,
        iconScale: 1.0,
        iconAngle: 0
    };

    GaugePointer.prototype.img = null;

    function GaugePointer(_at_gauge) {
        this.gauge = _at_gauge;
        if (this.gauge === void 0) {
            throw new Error('The element isn\'t defined.');
        }
        this.ctx = this.gauge.ctx;
        this.canvas = this.gauge.canvas;
        GaugePointer.__super__.constructor.call(this, false, false);
        this.setOptions();
    }

    GaugePointer.prototype.setOptions = function(options) {
        if (options == null) {
            options = null;
        }
        this.options = mergeObjects(this.options, options);
        this.length = 2 * this.gauge.radius * this.gauge.options.radiusScale * this.options.length;
        this.strokeWidth = this.canvas.height * this.options.strokeWidth;
        this.maxValue = this.gauge.maxValue;
        this.minValue = this.gauge.minValue;
        this.animationSpeed = this.gauge.animationSpeed;
        this.options.angle = this.gauge.options.angle;
        if (this.options.iconPath) {
            this.img = new Image();
            return this.img.src = this.options.iconPath;
        }
    };

    GaugePointer.prototype.render = function() {
        var angle, endX, endY, imgX, imgY, startX, startY, x, y;
        angle = this.gauge.getAngle.call(this, this.displayedValue);
        x = Math.round(this.length * Math.cos(angle));
        y = Math.round(this.length * Math.sin(angle));
        startX = Math.round(this.strokeWidth * Math.cos(angle - Math.PI / 2));
        startY = Math.round(this.strokeWidth * Math.sin(angle - Math.PI / 2));
        endX = Math.round(this.strokeWidth * Math.cos(angle + Math.PI / 2));
        endY = Math.round(this.strokeWidth * Math.sin(angle + Math.PI / 2));
        this.ctx.beginPath();
        this.ctx.fillStyle = this.options.color;
        this.ctx.arc(0, 0, this.strokeWidth, 0, Math.PI * 2, false);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.fill();
        if (this.img) {
            imgX = Math.round(this.img.width * this.options.iconScale);
            imgY = Math.round(this.img.height * this.options.iconScale);
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(angle + Math.PI / 180.0 * (90 + this.options.iconAngle));
            this.ctx.drawImage(this.img, -imgX / 2, -imgY / 2, imgX, imgY);
            return this.ctx.restore();
        }
    };

    return GaugePointer;

})(ValueUpdater);

Bar = (function() {
    function Bar(_at_elem) {
        this.elem = _at_elem;
    }

    Bar.prototype.updateValues = function(arrValues) {
        this.value = arrValues[0];
        this.maxValue = arrValues[1];
        this.avgValue = arrValues[2];
        return this.render();
    };

    Bar.prototype.render = function() {
        var avgPercent, valPercent;
        if (this.textField) {
            this.textField.text(formatNumber(this.value));
        }
        if (this.maxValue === 0) {
            this.maxValue = this.avgValue * 2;
        }
        valPercent = (this.value / this.maxValue) * 100;
        avgPercent = (this.avgValue / this.maxValue) * 100;
        $(".bar-value", this.elem).css({
            "width": valPercent + "%"
        });
        return $(".typical-value", this.elem).css({
            "width": avgPercent + "%"
        });
    };

    return Bar;

})();

Gauge = (function(_super) {
    __extends(Gauge, _super);

    Gauge.prototype.elem = null;

    Gauge.prototype.value = [20];

    Gauge.prototype.maxValue = 80;

    Gauge.prototype.minValue = 0;

    Gauge.prototype.displayedAngle = 0;

    Gauge.prototype.displayedValue = 0;

    Gauge.prototype.lineWidth = 40;

    Gauge.prototype.paddingTop = 0.1;

    Gauge.prototype.paddingBottom = 0.1;

    Gauge.prototype.percentColors = null;

    Gauge.prototype.options = {
        colorStart: "#6fadcf",
        colorStop: void 0,
        gradientType: 0,
        strokeColor: "#e0e0e0",
        pointer: {
            length: 0.8,
            strokeWidth: 0.035,
            iconScale: 1.0
        },
        angle: 0.15,
        lineWidth: 0.44,
        radiusScale: 1.0,
        fontSize: 40,
        limitMax: false,
        limitMin: false
    };

    function Gauge(_at_canvas) {
        var h, w;
        this.canvas = _at_canvas;
        Gauge.__super__.constructor.call(this);
        this.percentColors = null;
        if (typeof G_vmlCanvasManager !== 'undefined') {
            this.canvas = window.G_vmlCanvasManager.initElement(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        h = this.canvas.clientHeight;
        w = this.canvas.clientWidth;
        this.canvas.height = h;
        this.canvas.width = w;
        this.gp = [new GaugePointer(this)];
        this.setOptions();
    }

    Gauge.prototype.setOptions = function(options) {
        var gauge, phi, _i, _len, _ref;
        if (options == null) {
            options = null;
        }
        Gauge.__super__.setOptions.call(this, options);
        this.configPercentColors();
        this.extraPadding = 0;
        if (this.options.angle < 0) {
            phi = Math.PI * (1 + this.options.angle);
            this.extraPadding = Math.sin(phi);
        }
        this.availableHeight = this.canvas.height * (1 - this.paddingTop - this.paddingBottom);
        this.lineWidth = this.availableHeight * this.options.lineWidth;
        this.radius = (this.availableHeight - this.lineWidth / 2) / (1.0 + this.extraPadding);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        _ref = this.gp;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            gauge = _ref[_i];
            gauge.setOptions(this.options.pointer);
            gauge.render();
        }
        this.render();
        return this;
    };

    Gauge.prototype.configPercentColors = function() {
        var bval, gval, i, rval, _i, _ref, _results;
        this.percentColors = null;
        if (this.options.percentColors !== void 0) {
            this.percentColors = new Array();
            _results = [];
            for (i = _i = 0, _ref = this.options.percentColors.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
                rval = parseInt((cutHex(this.options.percentColors[i][1])).substring(0, 2), 16);
                gval = parseInt((cutHex(this.options.percentColors[i][1])).substring(2, 4), 16);
                bval = parseInt((cutHex(this.options.percentColors[i][1])).substring(4, 6), 16);
                _results.push(this.percentColors[i] = {
                    pct: this.options.percentColors[i][0],
                    color: {
                        r: rval,
                        g: gval,
                        b: bval
                    }
                });
            }
            return _results;
        }
    };

    Gauge.prototype.set = function(value) {
        var gp, i, val, _i, _j, _k, _len, _ref, _ref1;
        if (!(value instanceof Array)) {
            value = [value];
        }
        for (i = _i = 0, _ref = value.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            value[i] = this.parseValue(value[i]);
        }
        if (value.length > this.gp.length) {
            for (i = _j = 0, _ref1 = value.length - this.gp.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
                gp = new GaugePointer(this);
                gp.setOptions(this.options.pointer);
                this.gp.push(gp);
            }
        } else if (value.length < this.gp.length) {
            this.gp = this.gp.slice(this.gp.length - value.length);
        }
        i = 0;
        for (_k = 0, _len = value.length; _k < _len; _k++) {
            val = value[_k];
            if (val > this.maxValue) {
                if (this.options.limitMax) {
                    val = this.maxValue;
                } else {
                    this.maxValue = val + 1;
                }
            } else if (val < this.minValue) {
                if (this.options.limitMin) {
                    val = this.minValue;
                } else {
                    this.minValue = val - 1;
                }
            }
            this.gp[i].value = val;
            this.gp[i++].setOptions({
                minValue: this.minValue,
                maxValue: this.maxValue,
                angle: this.options.angle
            });
        }
        this.value = Math.max(Math.min(value[value.length - 1], this.maxValue), this.minValue);
        AnimationUpdater.run(this.forceUpdate);
        return this.forceUpdate = false;
    };

    Gauge.prototype.getAngle = function(value) {
        return (1 + this.options.angle) * Math.PI + ((value - this.minValue) / (this.maxValue - this.minValue)) * (1 - this.options.angle * 2) * Math.PI;
    };

    Gauge.prototype.getColorForPercentage = function(pct, grad) {
        var color, endColor, i, rangePct, startColor, _i, _ref;
        if (pct === 0) {
            color = this.percentColors[0].color;
        } else {
            color = this.percentColors[this.percentColors.length - 1].color;
            for (i = _i = 0, _ref = this.percentColors.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
                if (pct <= this.percentColors[i].pct) {
                    if (grad === true) {
                        startColor = this.percentColors[i - 1] || this.percentColors[0];
                        endColor = this.percentColors[i];
                        rangePct = (pct - startColor.pct) / (endColor.pct - startColor.pct);
                        color = {
                            r: Math.floor(startColor.color.r * (1 - rangePct) + endColor.color.r * rangePct),
                            g: Math.floor(startColor.color.g * (1 - rangePct) + endColor.color.g * rangePct),
                            b: Math.floor(startColor.color.b * (1 - rangePct) + endColor.color.b * rangePct)
                        };
                    } else {
                        color = this.percentColors[i].color;
                    }
                    break;
                }
            }
        }
        return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
    };

    Gauge.prototype.getColorForValue = function(val, grad) {
        var pct;
        pct = (val - this.minValue) / (this.maxValue - this.minValue);
        return this.getColorForPercentage(pct, grad);
    };

    Gauge.prototype.renderStaticLabels = function(staticLabels, w, h, radius) {
        var font, fontsize, match, re, rest, rotationAngle, value, _i, _len, _ref;
        this.ctx.save();
        this.ctx.translate(w, h);
        font = staticLabels.font || "10px Times";
        re = /\d+\.?\d?/;
        match = font.match(re)[0];
        rest = font.slice(match.length);
        fontsize = parseFloat(match) * this.displayScale;
        this.ctx.font = fontsize + rest;
        this.ctx.fillStyle = staticLabels.color || "#000000";
        this.ctx.textBaseline = "bottom";
        this.ctx.textAlign = "center";
        _ref = staticLabels.labels;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            value = _ref[_i];
            if (value.label !== void 0) {
                if ((!this.options.limitMin || value >= this.minValue) && (!this.options.limitMax || value <= this.maxValue)) {
                    font = value.font || staticLabels.font;
                    match = font.match(re)[0];
                    rest = font.slice(match.length);
                    fontsize = parseFloat(match) * this.displayScale;
                    this.ctx.font = fontsize + rest;
                    rotationAngle = this.getAngle(value.label) - 3 * Math.PI / 2;
                    this.ctx.rotate(rotationAngle);
                    this.ctx.fillText(formatNumber(value.label, staticLabels.fractionDigits), 0, -radius - this.lineWidth / 2);
                    this.ctx.rotate(-rotationAngle);
                }
            } else {
                if ((!this.options.limitMin || value >= this.minValue) && (!this.options.limitMax || value <= this.maxValue)) {
                    rotationAngle = this.getAngle(value) - 3 * Math.PI / 2;
                    this.ctx.rotate(rotationAngle);
                    this.ctx.fillText(formatNumber(value, staticLabels.fractionDigits), 0, -radius - this.lineWidth / 2);
                    this.ctx.rotate(-rotationAngle);
                }
            }
        }
        return this.ctx.restore();
    };

    Gauge.prototype.renderTicks = function(ticksOptions, w, h, radius) {
        var currentDivision, currentSubDivision, divColor, divLength, divWidth, divisionCount, lineWidth, range, rangeDivisions, scaleMutate, st, subColor, subDivisions, subLength, subWidth, subdivisionCount, t, tmpRadius, _i, _ref, _results;
        if (ticksOptions !== {}) {
            divisionCount = ticksOptions.divisions || 0;
            subdivisionCount = ticksOptions.subDivisions || 0;
            divColor = ticksOptions.divColor || '#fff';
            subColor = ticksOptions.subColor || '#fff';
            divLength = ticksOptions.divLength || 0.7;
            subLength = ticksOptions.subLength || 0.2;
            range = parseFloat(this.maxValue) - parseFloat(this.minValue);
            rangeDivisions = parseFloat(range) / parseFloat(ticksOptions.divisions);
            subDivisions = parseFloat(rangeDivisions) / parseFloat(ticksOptions.subDivisions);
            currentDivision = parseFloat(this.minValue);
            currentSubDivision = 0.0 + subDivisions;
            lineWidth = range / 400;
            divWidth = lineWidth * (ticksOptions.divWidth || 1);
            subWidth = lineWidth * (ticksOptions.subWidth || 1);
            _results = [];
            for (t = _i = 0, _ref = divisionCount + 1; _i < _ref; t = _i += 1) {
                this.ctx.lineWidth = this.lineWidth * divLength;
                scaleMutate = (this.lineWidth / 2) * (1 - divLength);

                tmpRadius = (this.radius * this.options.radiusScale) + scaleMutate - (0.1 * this.canvas.width); // to add offset
                // console.log(this.options, ticksOptions);
                this.ctx.strokeStyle = divColor;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, tmpRadius, this.getAngle(currentDivision - divWidth), this.getAngle(currentDivision + divWidth), false);
                this.ctx.stroke();
                currentSubDivision = currentDivision + subDivisions;
                currentDivision += rangeDivisions;
                if (t !== ticksOptions.divisions && subdivisionCount > 0) {
                    _results.push((function() {
                        var _j, _ref1, _results1;
                        _results1 = [];
                        for (st = _j = 0, _ref1 = subdivisionCount - 1; _j < _ref1; st = _j += 1) {
                            this.ctx.lineWidth = this.lineWidth * subLength;
                            scaleMutate = (this.lineWidth / 2) * (1 - subLength);
                            tmpRadius = (this.radius * this.options.radiusScale) + scaleMutate;
                            this.ctx.strokeStyle = subColor;
                            this.ctx.beginPath();
                            this.ctx.arc(0, 0, tmpRadius, this.getAngle(currentSubDivision - subWidth), this.getAngle(currentSubDivision + subWidth), false);
                            this.ctx.stroke();
                            _results1.push(currentSubDivision += subDivisions);
                        }
                        return _results1;
                    }).call(this));
                } else {
                    _results.push(void 0);
                }
            }
            return _results;
        }
    };

    Gauge.prototype.render = function() {
        var displayedAngle, fillStyle, gauge, h, max, min, radius, scaleMutate, tmpRadius, w, zone, _i, _j, _len, _len1, _ref, _ref1;
        w = this.canvas.width / 2;
        h = (this.canvas.height * this.paddingTop + this.availableHeight) - ((this.radius + this.lineWidth / 2) * this.extraPadding);
        displayedAngle = this.getAngle(this.displayedValue);
        if (this.textField) {
            this.textField.render(this);
        }
        this.ctx.lineCap = "butt";
        radius = this.radius * this.options.radiusScale;
        if (this.options.staticLabels) {
            this.renderStaticLabels(this.options.staticLabels, w, h, radius);
        }
        if (this.options.staticZones) {
            this.ctx.save();
            this.ctx.translate(w, h);
            this.ctx.lineWidth = this.lineWidth;
            _ref = this.options.staticZones;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                zone = _ref[_i];
                min = zone.min;
                if (this.options.limitMin && min < this.minValue) {
                    min = this.minValue;
                }
                max = zone.max;
                if (this.options.limitMax && max > this.maxValue) {
                    max = this.maxValue;
                }
                tmpRadius = this.radius * this.options.radiusScale;
                if (zone.height) {
                    this.ctx.lineWidth = this.lineWidth * zone.height;
                    scaleMutate = (this.lineWidth / 2) * (zone.offset || 1 - zone.height);
                    tmpRadius = (this.radius * this.options.radiusScale) + scaleMutate;
                }
                this.ctx.strokeStyle = zone.strokeStyle;
                this.ctx.beginPath();
                // Percentage based color zones
                let start = (min / 100) * this.maxValue;
                let end = (max / 100) * this.maxValue;
                // My changes
                this.ctx.arc(0, 0, tmpRadius, this.getAngle(start), this.getAngle(end), false);
                this.ctx.stroke();
            }
        } else {
            if (this.options.customFillStyle !== void 0) {
                fillStyle = this.options.customFillStyle(this);
            } else if (this.percentColors !== null) {
                fillStyle = this.getColorForValue(this.displayedValue, this.options.generateGradient);
            } else if (this.options.colorStop !== void 0) {
                if (this.options.gradientType === 0) {
                    fillStyle = this.ctx.createRadialGradient(w, h, 9, w, h, 70);
                } else {
                    fillStyle = this.ctx.createLinearGradient(0, 0, w, 0);
                }
                fillStyle.addColorStop(0, this.options.colorStart);
                fillStyle.addColorStop(1, this.options.colorStop);
            } else {
                fillStyle = this.options.colorStart;
            }
            this.ctx.strokeStyle = fillStyle;
            this.ctx.beginPath();
            this.ctx.arc(w, h, radius, (1 + this.options.angle) * Math.PI, displayedAngle, false);
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.stroke();
            this.ctx.strokeStyle = this.options.strokeColor;
            this.ctx.beginPath();
            this.ctx.arc(w, h, radius, displayedAngle, (2 - this.options.angle) * Math.PI, false);
            this.ctx.stroke();
            this.ctx.save();
            this.ctx.translate(w, h);
        }
        if (this.options.renderTicks) {
            this.renderTicks(this.options.renderTicks, w, h, radius);
        }
        this.ctx.restore();
        this.ctx.translate(w, h);
        _ref1 = this.gp;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            gauge = _ref1[_j];
            gauge.update(true);
        }
        return this.ctx.translate(-w, -h);
    };

    return Gauge;

})(BaseGauge);

BaseDonut = (function(_super) {
    __extends(BaseDonut, _super);

    BaseDonut.prototype.lineWidth = 15;

    BaseDonut.prototype.displayedValue = 0;

    BaseDonut.prototype.value = 33;

    BaseDonut.prototype.maxValue = 80;

    BaseDonut.prototype.minValue = 0;

    BaseDonut.prototype.options = {
        lineWidth: 0.10,
        colorStart: "#6f6ea0",
        colorStop: "#c0c0db",
        strokeColor: "#eeeeee",
        shadowColor: "#d5d5d5",
        angle: 0.35,
        radiusScale: 1.0
    };

    function BaseDonut(_at_canvas, options) {
        this.canvas = _at_canvas;
        BaseDonut.__super__.constructor.call(this);
        if (typeof G_vmlCanvasManager !== 'undefined') {
            this.canvas = window.G_vmlCanvasManager.initElement(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.setOptions(options);
        this.render();
    }

    BaseDonut.prototype.getAngle = function(value) {
        return (1 - this.options.angle) * Math.PI + ((value - this.minValue) / (this.maxValue - this.minValue)) * ((2 + this.options.angle) - (1 - this.options.angle)) * Math.PI;
    };

    BaseDonut.prototype.setOptions = function(options) {
        if (options == null) {
            options = null;
        }
        BaseDonut.__super__.setOptions.call(this, options);
        this.lineWidth = this.canvas.height * this.options.lineWidth;
        this.radius = this.options.radiusScale * (this.canvas.height / 2 - this.lineWidth / 2);
        return this;
    };

    BaseDonut.prototype.set = function(value) {
        this.value = this.parseValue(value);
        if (this.value > this.maxValue) {
            if (this.options.limitMax) {
                this.value = this.maxValue;
            } else {
                this.maxValue = this.value;
            }
        } else if (this.value < this.minValue) {
            if (this.options.limitMin) {
                this.value = this.minValue;
            } else {
                this.minValue = this.value;
            }
        }
        AnimationUpdater.run(this.forceUpdate);
        return this.forceUpdate = false;
    };

    BaseDonut.prototype.render = function() {
        var displayedAngle, grdFill, h, start, stop, w;
        displayedAngle = this.getAngle(this.displayedValue);
        w = this.canvas.width / 2;
        h = this.canvas.height / 2;
        if (this.textField) {
            this.textField.render(this);
        }
        grdFill = this.ctx.createRadialGradient(w, h, 39, w, h, 70);
        grdFill.addColorStop(0, this.options.colorStart);
        grdFill.addColorStop(1, this.options.colorStop);
        start = this.radius - this.lineWidth / 2;
        stop = this.radius + this.lineWidth / 2;
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.beginPath();
        this.ctx.arc(w, h, this.radius, (1 - this.options.angle) * Math.PI, (2 + this.options.angle) * Math.PI, false);
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = "round";
        this.ctx.stroke();
        this.ctx.strokeStyle = grdFill;
        this.ctx.beginPath();
        this.ctx.arc(w, h, this.radius, (1 - this.options.angle) * Math.PI, displayedAngle, false);
        return this.ctx.stroke();
    };

    return BaseDonut;

})(BaseGauge);

Donut = (function(_super) {
    __extends(Donut, _super);

    function Donut() {
        return Donut.__super__.constructor.apply(this, arguments);
    }

    Donut.prototype.strokeGradient = function(w, h, start, stop) {
        var grd;
        grd = this.ctx.createRadialGradient(w, h, start, w, h, stop);
        grd.addColorStop(0, this.options.shadowColor);
        grd.addColorStop(0.12, this.options._orgStrokeColor);
        grd.addColorStop(0.88, this.options._orgStrokeColor);
        grd.addColorStop(1, this.options.shadowColor);
        return grd;
    };

    Donut.prototype.setOptions = function(options) {
        var h, start, stop, w;
        if (options == null) {
            options = null;
        }
        Donut.__super__.setOptions.call(this, options);
        w = this.canvas.width / 2;
        h = this.canvas.height / 2;
        start = this.radius - this.lineWidth / 2;
        stop = this.radius + this.lineWidth / 2;
        this.options._orgStrokeColor = this.options.strokeColor;
        this.options.strokeColor = this.strokeGradient(w, h, start, stop);
        return this;
    };

    return Donut;

})(BaseDonut);

const AnimationUpdater = {
    elements: [],
    animId: null,
    addAll: function(list) {
        var elem, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = list.length; _i < _len; _i++) {
            elem = list[_i];
            _results.push(AnimationUpdater.elements.push(elem));
        }
        return _results;
    },
    add: function(object) {
        return AnimationUpdater.elements.push(object);
    },
    run: function(force) {
        var elem, finished, isCallback, _i, _len, _ref;
        if (force == null) {
            force = false;
        }
        isCallback = isFinite(parseFloat(force));
        if (isCallback || force === true) {
            finished = true;
            _ref = AnimationUpdater.elements;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                elem = _ref[_i];
                if (elem.update(force === true)) {
                    finished = false;
                }
            }
            return AnimationUpdater.animId = finished ? null : requestAnimationFrame(AnimationUpdater.run);
        } else if (force === false) {
            if (AnimationUpdater.animId === !null) {
                cancelAnimationFrame(AnimationUpdater.animId);
            }
            return AnimationUpdater.animId = requestAnimationFrame(AnimationUpdater.run);
        }
    }
};

export {
    Gauge,
    Donut,
    BaseDonut,
    TextRenderer,
    ValueUpdater,
    BaseGauge,
    AnimationUpdater,
    cutHex,
    formatNumber,
    mergeObjects,
};