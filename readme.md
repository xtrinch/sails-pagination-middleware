# sails-pagination-middleware

## About

Middleware for sails.js for finding the total count by criteria, via a Django rest framework inspired transformed request. 

Example of the transformed request:

    {
        "results": [{
            /* results here */
        }],
        "totalCount": 80
    }

Package follows the Sails initiative 'convention over configuration', so installing the middleware assumes, you would like to transform requests at all index endpoints.

## Sails version support
It only supports __Sails 1.x+__

## Basic Usage

```npm install --save sails-pagination-middleware```

Then in your `config/http.js`

    ```javascript
    middleware: {
    // ....

        // require it with whatever name you want
        paginate: require('sails-pagination-middleware'),

        // then add it to the order[] array
        order: [
          // ...
          'paginate',
          // ...
         ]
    ```

## Advanced Usage

You can create a policy, say we called it `api/policies/paginate.js`

    ```javascript
     module.exports = require('sails-pagination-middleware').generate({});
    ```

Then in `config/policies.js` you can specify which `find` call will get augmented with the count header.

    ```javascript
    UserController: {
        'find': ['isLoggedIn', 'paginate'],
    }
    ```

# Extra Options

There are options that you can change, just call the `generate()` function

    ```javascript
        require('sails-pagination-middleware').generate({
            // if you want to add/remove an action i.e. 'user/search' or whatever
            // the array can contain a string for exact match or a regular expression for a pattern
            // if you use this options, the array you use will override the default, it will NOT concat
            // this is the default,
            // it will match all the usual :model/find, :model/:id/:association/populate
            actions: ['find', 'populate', /^.*\/(find|populate)$/]

            // if the .count() calls fails, to throw an error or not
            silentError: false // default
        }),
    ```