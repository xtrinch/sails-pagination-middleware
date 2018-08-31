[![npm version](https://badge.fury.io/js/sails-pagination-middleware.svg)](https://badge.fury.io/js/sails-pagination-middleware)
[![npm](https://img.shields.io/npm/dt/sails-pagination-middleware.svg)]()

# sails-pagination-middleware

## About

Middleware for sails.js for finding the total count by criteria, via a Django rest framework inspired transformed request. 

Criteria pagination / filtering is built in to Sails, with keywords `limit`, `skip`, `where`. This package only adds a totalCount field to aid with building page indicators. You could define your page size in your frontend application with the keyword `limit` and just adjust `skip` accordingly. Meaning you could implement all sorts of different pagination indicators with this system.

Example of the transformed request to `/api/todos?skip=10&limit=10&where={"title":{"contains":"test"}}`:

    {
        "results": [{
            /* results here */
        }],
        "totalCount": 80
    }

Package follows the Sails initiative 'convention over configuration', so installing the middleware assumes, you would like to transform requests at all index endpoints. See section advanced usage for other options.

## Use case example

Check out an use case example over at [vue-sails-todo](https://github.com/xtrinch/vue-sails-todo).

## Basic Usage

    npm install --save sails-pagination-middleware

Then in your `config/http.js`, add `paginate` to first place in array:

    middleware: {
        paginate: require('sails-pagination-middleware'),
        order: [
          'paginate',
          // ...
         ]

## Sails version support
It only supports __Sails 1.x+__

## Advanced Usage

You can create a policy, say we called it `api/policies/paginate.js`

    module.exports = require('sails-pagination-middleware').generate({});

Then in `config/policies.js` you can specify which `find` call will get augmented with the count header.

    UserController: {
        'find': ['isLoggedIn', 'paginate'],
    }

## Extra Options

There are options that you can change, just call the `generate()` function

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
