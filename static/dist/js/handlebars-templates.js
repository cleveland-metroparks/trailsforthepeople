this["CM"] = this["CM"] || {};
this["CM"]["Templates"] = this["CM"]["Templates"] || {};

this["CM"]["Templates"]["info_attraction"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4>Activities:</h4>\n    <ul class=\"activities-icon-list\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"activity_icons") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":8,"column":17}}})) != null ? stack1 : "")
    + "    </ul>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <li><img src=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"src") : depth0), depth0))
    + "\" title=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\" alt=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\"></li>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"src") : stack1), depth0))
    + "\" width=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"width") : stack1), depth0))
    + "\" height=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"height") : stack1), depth0))
    + "\" alt=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"feature-description\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1), depth0))
    + "</div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <ul class=\"nobull\">\n        <li><a href=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"main_site_url") : stack1), depth0))
    + "\" target=\"_blank\">More info</a></li>\n    </ul>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</h2>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"activities") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":10,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"img") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":0},"end":{"line":14,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":0},"end":{"line":18,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"cmp_url") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":0},"end":{"line":24,"column":7}}})) != null ? stack1 : "")
    + "\n<h4>GPS coordinates:</h4>\n<div class=\"small-light\">\n    "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"coords_formatted") : stack1), depth0))
    + "\n</div>";
},"useData":true});

this["CM"]["Templates"]["info_reservation"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"src") : stack1), depth0))
    + "\" width=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"width") : stack1), depth0))
    + "\" height=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"height") : stack1), depth0))
    + "\" alt=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	<h4>Phone</h4>\n	<a title=\"Call "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\" href=\"tel:"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1), depth0))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</h2>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"img") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":5,"column":7}}})) != null ? stack1 : "")
    + "\n<p>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1), depth0))
    + "</p>\n\n<h4>Hours of Operation</h4>\n"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"hoursofoperation") : stack1), depth0))
    + "\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":0},"end":{"line":15,"column":7}}})) != null ? stack1 : "")
    + "\n<div class=\"lat_driving\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"drivingdestinationlatitude") : stack1), depth0))
    + "</div>\n<div class=\"lng_driving\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"drivingdestinationlongitude") : stack1), depth0))
    + "</div>";
},"useData":true});

this["CM"]["Templates"]["info_trail"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	Est time, walking: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"durationtext_hike") : stack1), depth0))
    + "<br/>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	Est time, bicycle: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"durationtext_bike") : stack1), depth0))
    + "<br/>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	Est time, horseback: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"durationtext_bridle") : stack1), depth0))
    + "<br/>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "</h2>\n\n<p>\nLength: "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"distancetext") : stack1), depth0))
    + "<br/>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"hike") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":0},"end":{"line":7,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"bike") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":0},"end":{"line":10,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"bridle") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":0},"end":{"line":13,"column":7}}})) != null ? stack1 : "")
    + "</p>\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"description") : stack1), depth0)) != null ? stack1 : "")
    + "\n\n<div class=\"elevationprofileimage\" style=\"text-align:center;\">\n    <canvas id=\"elevation-profile-trail\" alt=\"Elevation profile\"></canvas>\n</div>\n";
},"useData":true});

this["CM"]["Templates"]["pane_activities_item"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<li>\n    <a href=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"activity") : depth0)) != null ? lookupProperty(stack1,"link_url") : stack1), depth0))
    + "\">\n        <img class=\"ui-li-icon\" src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"activity") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\" /> <span class=\"title\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"activity") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</span>\n    </a>\n</li>\n";
},"useData":true});

this["CM"]["Templates"]["pane_amenities_item"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<li>\n    <a href=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"amenity") : depth0)) != null ? lookupProperty(stack1,"link_url") : stack1), depth0))
    + "\">\n        <i class=\"cm-icon cm-icon-"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"amenity") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></i>\n        "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"amenity") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "\n    </a>\n</li>\n";
},"useData":true});

this["CM"]["Templates"]["pane_trails_reservation_filter_option"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<option value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"reservation") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"reservation") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</option>\n";
},"useData":true});