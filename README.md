# Node Transcode Server

## Example Usage

```` js

POST http://localhost:3456/jobs/(image|video)

{
  "title": "resize profile pic for user 5432"
, "input": {
    "from": {
      "local": "./test/images/original.jpg"
    }
  }
, "outputs": [
    {
      "resize": {
        "width": 400
      , "height": 200
      , "strategy": "crop"
      }
    , "blur": 10
    , "quality": 80
    , "to": {
        "local": "./test/images/new-400.jpg"
      , "postback": "new-400.jpg"
      }
    }
  , {
      "resize": {
        "width": 200
      , "height": 100
      , "strategy": "crop"
      }
    , "quality": 70
    , "to": {
        "local": "./test/images/new-200.jpg"
      , "postback": "new-200.jpg"
      }
    }
  , {
      "resize": {
        "width": 50
      , "height": 50
      , "strategy": "crop"
      }
    , "quality": 70
    , "to": {
        "local": "./test/images/new-50.jpg"
      , "postback": "new-50.jpg"
      }
    }
  , {
      "resize": {
        "width": 20
      , "height": 20
      , "strategy": "crop"
      }
    , "quality": 70
    , "to": {
        "local": "./test/images/new-10.jpg"
      , "postback": "new-10.jpg"
      }
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
, "strategy": [fit|crop|pad|stretch]
, "zoom": true
, "gravity": ["center", ...] (when cropping or padding)
, "background": [color]
}

````