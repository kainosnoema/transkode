
var Geometry = module.exports = function Geometry(width, height) {
  if(typeof width == 'object') {
    height = width.height;
    width = width.width;
  }
  this.width = parseFloat(width);
  this.height = parseFloat(height);
  this.modifier = "^";
}

// adjust measurements to compensate for orientation
Geometry.prototype.autoOrient = function autoOrient(orientation) {
  switch(orientation.toLowerCase()) {
    case 'righttop':
    case 'leftbottom':
      var width = this.height;
      this.height = this.width;
      this.width = width;
    break;
  }
  return this;
}

Geometry.prototype.isSquare = function isSquare() {
  return this.height == this.width;
}

Geometry.prototype.isHorizontal = function isHorizontal() {
  return this.height < this.width;
}

Geometry.prototype.isVertical = function isVertical() {
  return this.height > this.width;
}

Geometry.prototype.maximum = function maximum() {
  return Math.max(this.height, this.width);
}

Geometry.prototype.minimum = function minimum() {
  return Math.min(this.height, this.width);
}

Geometry.prototype.toString = function toString() {
  var s = ""
  if(this.width > 0)
    s += parseInt(this.width);
  if(this.height > 0)
    s += "x" + parseInt(this.height);
  s += this.modifier;
  return s;
}

Geometry.prototype.smallerThan = function smallerThan(dst) {
  return this.height < dst.height || this.width < dst.width;
}

Geometry.prototype.cropTo = function cropTo(dst) {
  return this.transformTo(dst, true);
}

// return a Transform object containing resize and crop arguments
Geometry.prototype.transformTo = function transformTo(dst, shouldCrop) {
  var resize_geo
    , crop_geo;
  
  if(shouldCrop) {
    var ratio = new Geometry(dst.width / this.width, dst.height / this.height);
    resize_geo = this.resize(dst, ratio);
    crop_geo = this.crop(dst, ratio);
  } else {
    resize_geo = dst.toString();
  }
  
  return new Transform(resize_geo, crop_geo);
}

// return resize arguments needed to transform to dst geometry
Geometry.prototype.resize = function resize(dst, ratio) {
  var resize;
  if(ratio.isHorizontal() || ratio.isSquare()) {
    resize = dst.width + "x";
  } else {
    resize = "x" + dst.height;
  };
  if(this.smallerThan(dst))
    resize += '^';
  return resize;
}

// return crop arguments needed to transform to dst geometry
Geometry.prototype.crop = function crop(dst, ratio) {
  if(ratio.isHorizontal() || ratio.isSquare()) {
    return dst.width + "x" + dst.height + "+0+" + ((this.height * ratio.width - dst.height) / 2).toFixed(2);
  } else {
    return dst.width + "x" + dst.height + "+" + ((this.width * ratio.height - dst.width) / 2).toFixed(2) + "+0";
  };
}

var Transform = module.exports.Transform = function(resize, crop) {
  this.resize = resize;
  this.crop = crop;
}