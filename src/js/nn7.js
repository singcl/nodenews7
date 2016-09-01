/*global Framework7, Dom7, Template7, moment, hnapi */

(function (Framework7, $$, T7, moment, hnapi) {
    'use strict';

    // Helpers
    T7.registerHelper('time_ago', function (time) {
        return moment.unix(time).fromNow();
    });
    T7.registerHelper('array_length', function (arr) {
        return arr ? arr.length : 0;
    });
    T7.registerHelper('pluralize', function (arr, options) {
        return (arr.length === 1) ? options.hash.single : arr.length + " " + options.hash.multiple;
    });
    T7.registerHelper('notEmpty', function (value) {
        return value || 0;
    });

    var app, mainView, leftView, splitView, allowCommentsInsert;

    // Init App
    app = new Framework7({
        modalTitle: 'HackerNews7',
        animateNavBackIcon: true,
        precompileTemplates: true,
        template7Pages: true,
        externalLinks: 'a.external, .message a',
        router: true
    });

    // Add Right/Main View
    mainView = app.addView('.view-main', {
        dynamicNavbar: true,
        animatePages: false,
        swipeBackPage: false,
        reloadPages: true,
        preloadPreviousPage: false
    });

    // Add Left View
    /*
    leftView = app.addView('.view-left', {
        dynamicNavbar: true
    }); 
    */

    // Update data
    function updateStories(stories, topic) {
        app.template7Data.stories = stories;
        app.template7Data.topic = topic;
        $$('.page[data-page="index"] .page-content .list-block').html(T7.templates.storiesTemplate(stories));
        $$('.page[data-page="panel-left"] .page-content .list-block').html(T7.templates.panelLeftTemplate(topic));
    }
    // Fetch Stories
    function getStories(refresh) {
        var tem = [{title:'good',num: 0, icon: 'icon-good'}, {title:'share',num: 0, icon: 'icon-i-share'}, {title:'ask',num: 0, icon: 'icon-iconask'}, {title:'job',num: 0, icon: 'icon-zhaopin'}];
        var results = refresh ? [] : JSON.parse(window.localStorage.getItem('stories')) || [];
        var topicArr = refresh ? tem : JSON.parse(window.localStorage.getItem('topic')) || tem;
        var   storiesCount = 0;
        if (results.length === 0) {
            if (!refresh) {
                app.showPreloader('Loading top stories : <span class="preloader-progress">0</span> %');
            }
            hnapi.getTopics({page: 1,limit:100}, function (resp) {
                resp = JSON.parse(resp);
                var data = resp.data;
                var limit = 100;
                data.splice(limit, data.length - limit);
                data.forEach(function (value, index) {
                    hnapi.getTopicDtails(value, function (resp) {
                        resp = JSON.parse(resp);
                        var data = resp.data;
                        topicArr.forEach(function(value, index) {
                            if (value.title === data.tab) {
                                value.num += 1;
                            };
                        })
                        results[index] = data;
                        storiesCount += 1;
                        $$('.preloader-progress').text(Math.floor(storiesCount / limit * 100));
                        if (results.length === limit) {
                            if (!refresh) {
                                app.hidePreloader();
                            }
                            // Clear Empty Object in list
                            results = results.filter(function (n) {
                                return n !== null;
                            });
                            // Update local storage data
                            window.localStorage.setItem('stories', JSON.stringify(results));
                            window.localStorage.setItem('topic', JSON.stringify(topicArr));
                            // PTR Done
                            app.pullToRefreshDone();
                            // reset .refresh-icon if necessary
                            $$('.refresh-link.refresh-home').removeClass('refreshing');
                            // Clear searchbar
                            // $$('.searchbar-input input')[0].value = '';
                            // Update T7 data and render home page stories
                            updateStories(results, topicArr);
                        }
                    });
                });
            });
        } else {
            // Update T7 data and render home page stories
            updateStories(results, topicArr);
        }
        return results;
    }

    // Update stories on PTR
    $$('.pull-to-refresh-content').on('refresh', function () {
        $$('.refresh-link.refresh-home').addClass('refreshing');
        getStories(true);
    });
    $$('.refresh-link.refresh-home').on('click', function () {
        var clicked = $$(this);
        if (clicked.hasClass('refreshing')) {
            return;
        }
        clicked.addClass('refreshing');
        getStories(true);
    });

    // Comments
    function getComments(page) {
        allowCommentsInsert = true;
        var id = page.context.id,
            story,
            commentsCount = 0;
        for (var i = 0; i < app.template7Data.stories.length; i += 1) {
            if (app.template7Data.stories[i].id === id) {
                story = app.template7Data.stories[i];
            }
        }
        if (story.reply_count) {
            hnapi.getTopicDtails(story, function(resp) {
                resp = JSON.parse(resp);
                var data = resp.data;

                data.replies.forEach(function(value, index) {
                    commentsCount += 1;
                    $$(page.container).find('.preloader-progress').text(Math.floor(commentsCount / data.replies.length * 100));
                    if (commentsCount === data.replies.length && allowCommentsInsert) {
                        $$(page.container).find('.story-comments .messages').html(T7.templates.commentsTemplate(data.replies));
                    }
                }, function (err) {
                    commentsCount += 1;
                });  
            })
        } else {
            $$(page.container).find('.story-comments .messages').html('<div>No comments</div>');
        }
    }

    //页面回调
    app.onPageInit('item', function (page) {
        if (page.view === mainView) {
            getComments(page);
        }
    });

    app.onPageAfterAnimation('item', function (page) {
        if (page.view === leftView) {
            getComments(page);
        }
    });
    app.onPageBack('item', function () {
        allowCommentsInsert = false;
    });
    $$(document).on('click', '.message a', function (e) {
        e.preventDefault();
        window.open($$(this).attr('href'));
    });

    // Search HN
    function updateOnSearch(results, limit) {
        if (results.length === limit) {
            // Reset search filter
            $$('.page[data-page="index"]').find('.searchbar-not-found').hide();
            $$('.page[data-page="index"]').find('.searchbar-not-found').html("Not Found");
            $$('.page[data-page="index"]').find('.searchbar-found').show();
            // Clear Empty Object in list
            results = results.filter(function (n) {
                return n !== null;
            });
            // reset .refresh-icon if necessary
            $$('.refresh-link.refresh-home').removeClass('refreshing');
            // Render page stories
            updateStories(results);
        }
    }
    $$('.page[data-page="index"] input[type="search"]').on('keyup', function (e) {
        if (e.keyCode === 13) {
            $$('.refresh-link.refresh-home').addClass('refreshing');
            $$('.page[data-page="index"]').find('.searchbar-not-found').html("Searching throw HN...");
            hnapi.search(this.value, function (data) {
                var results = [],
                    limit = 20;
                data = JSON.parse(data);
                data.hits.forEach(function (item, i) {
                    hnapi.item(item.objectID, function (data) {
                        data = JSON.parse(data);
                        if (data) {
                            data.domain = data.url ? data.url.split('/')[2] : '';
                        }
                        results[i] = data;
                        updateOnSearch(results, limit);
                    }, function (err) {
                        limit -= 1;
                        updateOnSearch(results, limit);
                    });
                });
            });
        }
    });
    $$('.page[data-page="index"] .searchbar-cancel').on('click', function () {
        updateStories(JSON.parse(window.localStorage.getItem('stories')) || []);
    });

    // Get and parse stories on app load
    getStories();

    // Export app to global
    window.app = app;

}(Framework7, Dom7, Template7, moment, hnapi));
