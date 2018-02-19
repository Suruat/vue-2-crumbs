# vue-2-crumbs

Breadcrumbs plugin for Vue.js 2 framework that allows to select parent route in route meta object with no need of sub-routing.

##### Features:
- [Setting parent](#simple-example) route without need to actually nest it in children array
- [Sub-routing](#sub-routing) as default behavior
- Define [breadcrumb info](#define-breadcrumb-data-in-component) in page component
- Shorthand labeling (`breadcrumb: 'Page Label'`)
- [Dynamic breadcrumbs](#dynamic-breadcrumbs) (with some caveats).

##### Requirements:
- Vue: 2.x.x,
- vue-router: ^2.1.x

## Installation

```sh
$ npm install vue-2-crumbs --save
```

```js
import Vue from 'vue'
import Vue2Crumbs from 'vue-2-crumbs'

Vue.use(Vue2Crumbs)
```
After that `<app-breadcrumbs></app-breadcrumbs>` component would be at your expose.

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
IF you need to use dynamic breadcrumb in the middle of your breadcrumb list, than you should provide whole chain in component's `parentsList` property. You need to provide list of objects that contain `path` and `label`, like in example below:

**Post.vue**
```
breadcrumb () {
  return {
    label: this.postTitle,
    parentsList: [
      {
        path: `/${this.$route.params.categorySlug}`,
        label: this.categoryTitle
      },
      {
        path: '/',
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
