/*global Framework7, Dom7, Template7, moment, nnapi */

(function (Framework7, $$, T7, moment, nnapi) {
    'use strict';

    //Helpers
    T7.registerHelper('topicClass', function(tab) {
        return {'share': '分享','job': '招聘','ask': '问答'}[tab] ||'Miss';
    });

    T7.registerHelper('date_created', function(date) {
        return moment(date).fromNow();
    });

    T7.registerHelper('date_public', function(date) {
        return moment(date).format('ddd YYYY-MM-DD HH:mm');
    });

    // Init App
    var app = new Framework7({
        precompileTemplates: true,
        template7Pages: true
    });

    // Add Main View
    var mainView = app.addView('.view-main', {
        dynamicNavbar: true
    });

    //left panel
    var topics = [{title:'精华',icon: 'icon-good'}, {title:'分享',icon: 'icon-i-share'}, {title:'问答',icon: 'icon-iconask'}, {title:'招聘',icon: 'icon-zhaopin'}]
    $$('.page[data-page="panel-left"] .page-content .list-block').html(T7.templates.panelLeftTemplate(topics));
  
    function showTopics(options) {
        nnapi.getTopics(options, function(resp, status, xhr) {
            resp = JSON.parse(resp);
            var data = resp.data;
            console.log('调用接口：' + xhr.requestUrl + '\n' + '参数列表：' + xhr.requestParameters);
            $$('.page[data-page="index"] .page-content .list-block').append(T7.templates.storiesTemplate(data));   
        });
    }

    //无限滚动
    var count = 1;
    function infiniteScroll() {
        var loading = false;
        var lastIndex = $$('.page[data-page="index"] .list-block li').length;
        var maxItems = 100;
        var itemPerLoad = 10;
        $$('.infinite-scroll').on('infinite', function() {
            if (loading) return;
            loading = true;
            setTimeout(function() {
                loading = false;
                if (lastIndex >= maxItems) {
                    app.detachInfiniteScroll($$('.infinite-scroll'));
                   // 删除加载提示符
                   $$('.infinite-scroll-preloader').remove();
                   return;
                }
                count += 1;
                showTopics({page: count, limit: itemPerLoad});
                lastIndex = $$('.page[data-page="index"] .list-block li').length;
            },300);
        });
    }

    showTopics({page: 1, limit: 10});
    infiniteScroll();

    //下拉刷新
    function refresh() {
        // app.template7Data = {};
        count = 1;
        nnapi.getTopics({page:1, limit:10}, function(resp, status, xhr) {
            resp = JSON.parse(resp);
            var data = resp.data;
            console.log('刷新页面！调用接口：' + xhr.requestUrl + '\n' + '参数列表：' + xhr.requestParameters);
            $$('.page[data-page="index"] .page-content .list-block').html(T7.templates.storiesTemplate(data));
        });
        // PTR Done
        app.pullToRefreshDone();
        // reset .refresh-icon if necessary
        $$('.refresh-link.refresh-home').removeClass('refreshing');
    }
   
    // Update stories on PTR
    $$('.pull-to-refresh-content').on('refresh', function () {
        $$('.refresh-link.refresh-home').addClass('refreshing');
        setTimeout(function() {
            refresh();
        }, 1000);
    });

    $$('.refresh-link.refresh-home').on('click', function () {
        var clicked = $$(this);
        if (clicked.hasClass('refreshing')) {
            return;
        }
        clicked.addClass('refreshing');
        setTimeout(function() {
            refresh();
        },1000);
    });

    // Comments
    function getComments(data) {
        if (data.reply_count) {
            $$('.page[data-page="item"]').find('.story-comments .messages').html(T7.templates.commentsTemplate(data.replies));  
        } else {
            $$('.page[data-page="item"]').find('.story-comments .messages').html('<div>暂无评论</div>');
        }
    }

    //调用接口获取数据 > 用数据渲染模板 > 路由切换页面载入模板
    function showDetails(id) {
        nnapi.getTopicDtails(id, function(resp, status, xhr) {
            console.log('调用详情页接口：' + xhr.requestUrl + '\n' + '参数列表：' + xhr.requestParameters);
            resp = JSON.parse(resp);
            var data = resp.data;
            var itemCompiled = Template7.templates.itemTemplate(data);
            // mainView.router.load({content: itemCompiled});
            mainView.router.loadContent(itemCompiled);
            getComments(data);
        });
    }

    $$('.page[data-page="index"] .list-block').on('click','a', function(e) {
       var id = this.id;
       showDetails(id);
    })

   //setting reply pupup
    $$('.open-reply-modal').on('click', function() {
        app.modal({
            title: '提示',
            text: '您点击了回复！',
            buttons: [
                {
                    text: '确定',
                    bold: true,
                    onClick: function() {
                        app.closeModal('.popup-reply');
                        app.alert('Goodbye');
                    }
                }
            ]
        })
    })

    // Export app to global
    window.app = app;

}(Framework7, Dom7, Template7, moment, nnapi));
