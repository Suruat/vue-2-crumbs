# vue-2-crumbs

Breadcrumbs plugin for Vue.js 2 framework allows to select parent route in route meta object with no need of sub-routing.

##### Features:
- [Setting parent](#simple-example) route without need to actually nest it in children array
- [Customized template](#custom-template) are allowed using scoped slots
- [Sub-routing](#sub-routing) as default behavior
- Define [breadcrumb info](#define-breadcrumb-data-in-component) in page component
- Shorthand labeling (`breadcrumb: 'Page Label'`)
- Define parent's [params, query, hash](#define-parents-params-query-hash)
- [Dynamic breadcrumbs](#dynamic-breadcrumbs) (with some caveats).

## Installation

```sh
$ npm install vue-2-crumbs --save
```

```js
import Vue from 'vue'
import Vue2Crumbs from 'vue-2-crumbs'

Vue.use(Vue2Crumbs)
```
After that `<app-breadcrumbs></app-breadcrumbs>` component would be at your disposal.

## Usage
Use the `breadcrumb` property in route's `meta` to provide route label or/and parent route `name` as in example below:

### Simple Example
```js
new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home', // Be sure to set 'name' property for the route you want to be "parent" route
      component: Home,
      meta: {
        breadcrumb: 'Home Custom Label' // This is a shorthand for case you want to set just breadcrumb label
      }
    },
    {
      path: '/about',
      name: 'about',
      component: About,
      meta: {
        breadcrumb: {
          label: 'Custom About page Label',
          parent: 'home' // Here you should use exact string as for name property in "parent" route
        }
      }
    },
    {
      path: '/contact',
      name: 'contact', // name property would also used as default route label for breadcrumbs
      component: Contact,
      meta: {
        breadcrumb: {
          parent: 'about'
        }
      }
    }
  ]
})
```
##### Result:
![Simple Usage Result](https://raw.githubusercontent.com/Suruat/vue-2-crumbs/master/screenshots/simple-usage.png)


### Custom template
#### __(new in v0.5.1)__
By default component's template is `ul > li > router-link`. But starts with _v0.5.1_ you can provide custom template using __scoped slots__ and __container__ prop at `app-breadcrumbs` component.

You will have `label` string `to` object and `utils` object at your disposal. `utils` is helper object, that serves you to contain all information you may want to use in custom template. Aware that `utils` can be _undefined_, so you need to check it before use it in template.

To define `utils` object just add it to `breadcrumb` object in router definition or [directly in component](#define-breadcrumb-data-in-component).

For targeting current page in breadcrumb chain, use named slot - `current`. Parents breadcrumb chunks is default slot.
*__Note:__ Obviously, you should define `router-link` at some point, in your custom template for make breadcrumbs work.*
#### Example:
```
<app-breadcrumbs container="nav">
  <h6 slot-scope="{to, label, utils}">
    <router-link
      :to="to"
      class="your-custom-class"
      exact
      :itemprop="utils && utils.itemprop"
    >{{label}}</router-link>
    <i class="fas fa-angle-right"></i>
  </h6>

  <span
    slot="current"
    slot-scope="{label}"
    class="custom-current-class"
  >{{label}}</span>
</app-breadcrumbs>
```


### Sub-routing
Plugin also supports default behavior for nested routes:
```
new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Page,
      children: [
        {
          path: '/about',
          component: About,
          meta: {
            breadcrumb: {
              label: 'Custom About page Label'
            }
          },
          children: [
            {
              path: '/contact',
              component: Contact,
              meta: {
                breadcrumb: 'Contact Custom Label'
              }
            }
          ]
        }
      ]
    }
  ]
})
```
You can combine this approaches:
```
new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        {
          path: 'about',
          component: About,
          meta: {
            breadcrumb: {
              label: 'Custom About page Label'
            }
          },
          children: [
            {
              path: 'contact',
              name: 'contact',
              component: Contact,
              meta: {
                breadcrumb: 'Contact Custom Label'
              }
            },
            {
              path: 'terms',
              component: Terms,
              meta: {
                breadcrumb: {
                  label: 'Terms',
                  parent: 'contact'
                }
              }
            }
          ]
        }
      ]
    }
  ]
})
```
##### Result:
![Combine Usage Result](https://raw.githubusercontent.com/Suruat/vue-2-crumbs/master/screenshots/combine-usage.png)


### Define Breadcrumb Data in Component
You easily can define breadcrumbs information in page components. This would overwrite data in the router. For example:
**Terms.vue**
```
breadcrumb: {
  label: 'Terms Label From Component',
  parent: 'contact'
},
data () {
  return {
    ...
  }
}
```
**Contact.vue**
```
breadcrumb: 'Contact Label from Component',
data () {
  return {
    ...
  }
}
```
**Router**
```
new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        {
          path: 'about',
          component: About,
          meta: {
            breadcrumb: {
              label: 'Custom About page Label'
            }
          },
          children: [
            {
              path: 'contact',
              name: 'contact',
              component: Contact,
              meta: {
                breadcrumb: {
                  parent: 'home'
                }
              }
            },
            {
              path: 'terms',
              component: Terms
            }
          ]
        }
      ]
    }
  ]
})
```
##### Result:
![Combine Usage Result](https://raw.githubusercontent.com/Suruat/vue-2-crumbs/master/screenshots/component-usage.png)


### Define parent's params, query, hash
#### __(new in v0.5.1)__
You can provide not only route's name as a `parent` property, but also it's params, query and hash. Just use object with corresponding keys:
```
parent: {
  name: 'category',
  params: {
    catSlug: 'latest',
  },
  query: {
    sort: 'ASC'
  },
  hash: '#test'
}
```


### Dynamic Breadcrumbs
You can use **dynamic data** to provide breadcrumb information (as `label` and `parent`) in page component.
**IMPORTANT!** Because of the tech limitations, you need to be sure, that dynamic breadcrumb is the last one in the list. Plugin doesn't allowed to build breadcrumbs list with dynamic part in the middle of it. To handle this cases, please check [using `parentsList` property](#using-parentslist).

**Terms.vue**
```
breadcrumb () {
  return {
    label: this.title,
    parent: this.parent
  }
},
data () {
  return {
    title: 'Dynamic Terms Label',
    parent: 'home'
  }
}
```
**Router**
```
new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        {
          path: 'about',
          component: About,
          meta: {
            breadcrumb: {
              label: 'Custom About page Label'
            }
          },
          children: [
            {
              path: 'contact',
              name: 'contact',
              component: Contact,
              meta: {
                breadcrumb: {
                  parent: 'home'
                }
              }
            },
            {
              path: 'terms',
              component: Terms
            }
          ]
        }
      ]
    }
  ]
})
```
##### Result:
![Combine Usage Result](https://raw.githubusercontent.com/Suruat/vue-2-crumbs/master/screenshots/dynamic-breadcrumb.png)


### Using `parentsList`
If you need to use dynamic breadcrumb in the middle of your breadcrumb list, than you should provide whole chain in component's `parentsList` property. You need to provide list of objects that contain `path` and `label`, like in example below:

**Post.vue**
```
breadcrumb () {
  return {
    label: this.postTitle,
    parentsList: [
      {
        to: {
          name: 'category',
          params: {
            catSlug: this.$route.params.catSlug
          }
        },
        label: this.categoryTitle
      },
      {
        to: {
          name: 'blog',
          query: {
            section: 'news'
          },
          hash: '#hot'
        },
        label: 'Blog Page'
      },
      {
        to: '/',
        label: 'Home'
      }
    ]
  }
},
data () {
  return {
    postTitle: '',
    categoryTitle: ''
  }
},
created () {
  let {categorySlug, postSlug} = this.$route.params
  // Some API calls
  // ...
  this.postTitle = 'Breaking News!'
  this.categoryTitle = 'Latest'
}
```
**Router**
```
new VueRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/:categorySlug',
      name: 'category',
      component: Category
    },
    {
      path: '/:categorySlug/:postSlug',
      component: Post
    }
  ]
})
```
##### Result:
![Combine Usage Result](https://raw.githubusercontent.com/Suruat/vue-2-crumbs/master/screenshots/parentsList.png)


# License

[MIT](http://opensource.org/licenses/MIT)
