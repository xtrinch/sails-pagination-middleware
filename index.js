
const package = require('./package.json');

const defaults = {
    actions: ['find', 'populate', /^.*\/(find|populate)$/],
    silentError: false,
};

const isRegExp = (value) => {
    return value instanceof RegExp;
};

const isNotRegExp = (value) => {
    return !isRegExp(value);
};

const generate = (options = {}) => {
    options = Object.assign({}, defaults, options);

    options.actions = [].concat(options.actions);

    let actions = {
        map: [...options.actions].filter(isNotRegExp).reduce((hash, key) => { hash[key] = true; return hash; }, {}),
        regexps: [...options.actions].filter(isRegExp)
    };

    const testAction = function (action) {
        if (actions.map[action]) {
            return true;
        }
        if (actions.regexps.some((re) => re.test(action))) {
            return true;
        }
    };

    let silentError = options.silentError;

    let middleware = function (req, res, next) {
        let getCount = function() {
            let action = req.options.blueprintAction || req.options.action;
            req[`__${package.name}__`] = true;

            let sendArgs = Array.from(arguments);

            let parseBlueprintOptions = req.options.parseBlueprintOptions
                || req._sails.config.blueprints.parseBlueprintOptions
                || req._sails.hooks.blueprints.parseBlueprintOptions;

            if (!parseBlueprintOptions) {
                req._sails.log.warn(`[${package.name}] middleware ignored, parseBlueprintOptions function not supported, are you sure you\'re using sails 1.0+`);
                return oldSendOrNext.apply(res, arguments);
            }

            let queryOptions = parseBlueprintOptions(req);
            let Model = req._sails.models[queryOptions.using];

            // todo: pile of sh*t part-1
            // https://gitter.im/balderdashy/sails?at=5a3d24bcba39a53f1a903eef
            let populatingAssociation;
            if (/populate/.test(action) && queryOptions.alias) {
                populatingAssociation = Model.associations.filter(association => association.alias === queryOptions.alias)[0];
            }
            let PopulatingAssociationModel;
            if (populatingAssociation) {
                PopulatingAssociationModel = req._sails.models[populatingAssociation[populatingAssociation.type]];
            }
            let modelAssociation;
            if (PopulatingAssociationModel) {
                modelAssociation = PopulatingAssociationModel.associations.filter(association => association.collection === queryOptions.using || association.model === queryOptions.using)[0];
            }

            let criteria = Object.assign({}, queryOptions.criteria);
            let populates = Object.assign({}, queryOptions.populates);

            let limit = req.param('limit') || criteria.limit || (populates[queryOptions.alias] || {}).limit;
            let skip = req.param('skip') || criteria.skip || (populates[queryOptions.alias] || {}).skip;
            let sort = req.param('sort') || criteria.sort || (populates[queryOptions.alias] || {}).sort;
            
            // sails will throw an error if I don't do this
            delete criteria.limit;
            delete criteria.skip;
            delete criteria.sort;

            let promise;

            if (PopulatingAssociationModel && criteria.where && criteria.where.id && modelAssociation) {
                // todo: pile of sh*t part-2
                let id = criteria.where.id;
                delete criteria.where.id;
                let associationCriteria = Object.assign({}, criteria);
                associationCriteria.where[modelAssociation.alias] = [id];
                promise = PopulatingAssociationModel.count(associationCriteria);
            } else {
                promise = Model.count(criteria);
            }

            return promise.then(
                    (count) => {
                        return count;
                    })
                .catch(
                    (err) => {
                        if (! silentError) {
                            req._sails.log.error(`[${package.name}] Was not able to get count for '${req.originalUrl}'\n${err.toString()}`);
                        }
                        return -1;
                    }
                );
        };


        var origJson = res.json;
        res.json = function(val) {
            return getCount().then(function(count) {
                if (Array.isArray(val)) {
                    return origJson.call(res, {
                        totalCount: count,
                        results: val,
                    }); 
                } else {
                    return origJson.call(res, val);
                }
            });
        };

        next();
    };

    middleware.generate = generate;

    return middleware;
};

module.exports = generate();
