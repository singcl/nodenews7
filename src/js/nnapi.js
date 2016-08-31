/*global Framework7, Dom7 */

(function (Framework7, $$) {
    'use strict';

    var urls = ['https://cnodejs.org/api/v1/'];

    var hnapi = {
        urls: urls,

        //my nodeniew api
        getTopics: function(options, success, error) {
            options = options || {};
            return $$.ajax({
                method: 'GET',
                url: urls[0] + 'topics',
                data: {
                    page: options.page,
                    tab: options.tab,
                    limit: options.limit,
                    mdrender: options.mdrender
                },
                success: success,
                error: error
            });
        },

        getTopicDtails: function(value, success, error) {
            var id = value.id;
            return $$.ajax({
                method: 'GET',
                url: urls[0] + 'topic/' + id,
                success: success,
                error: error
            });
        }
    };

    window.hnapi = hnapi;

}(Framework7, Dom7));