# transkode

Node-powered, Redis-backed (queued) transcoding server for images and video (coming).

## Is it any good?

No. This is just an experiment and is NOT production ready.

## Dependancies

- Node.js v0.4.6+
- Redis v2.0+
- GraphicsMagick

## Proposed Usage

```` js

POST http://localhost:4422/jobs/(image|video)

{
  "title": "resize profile pic for user 5432"
, "input": {
    "filename": "original.jpg"
  , "local": "./test/images/original.jpg"
  }
, "outputs": [
    {
      "resize": { "to": "400x200", "strategy": "crop" }
    , "blur": 10
    , "quality": 80
    , "cloudfiles": {
        "container": "..."
      , "name": "profile_images/new/400.jpg"
      }
    }
  , {
      "resize": { "to": "200x100", "strategy": "crop" }
    , "quality": 70
    , "local": "./test/images/new-200.jpg"
    }
  , {
      "resize": { "to": "50", "strategy": "crop" }
    , "quality": 70
    , "local": "./test/images/new-50.jpg"
    }
  , {
      "resize": { "to": "20", "strategy": "crop" }
    , "quality": 70
    , "local": "./test/images/new-10.jpg"
    }
  ]
, "wait": true
, "meta": {
    "user_id": 5432
  }
, "postback_url": "http://localhost:3000/transcode"
}

````

## Image Processors

### resize

```` js

"resize": {
  "width": 100
, "height": 100
, "to": "100x100"
, "strategy": [fit|crop|pad|stretch]
, "zoom": true
, "gravity": ["center", ...] (when cropping or padding)
, "background": [color]
}

````

## Authors

  * Evan Owen

## License

(The MIT License)

Copyright (c) 2011 Evan Owen &lt;kainosnoema@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.