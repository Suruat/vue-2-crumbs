import Breadcrumbs from './breadcrumbComponent'
import isEqual from 'lodash.isequal'

const vue2Crumbs = {
  version: '0.5.4',
  install (Vue, options) {
    function $vue2CrumbsDispatchNewValue (meta) {
      const { label, parentsList, parent, utils } = this.$breadcrumb

      if (!meta.breadcrumb) {
        meta.breadcrumb = {}
      }

      if (typeof meta.breadcrumb === 'string') {
        meta.breadcrumb = {
          label: meta.breadcrumb
        }
      }

      if (label) {
        meta.breadcrumb.label = label
      }

      if (parent) {
        meta.breadcrumb.parent = parent
      }

      if (parentsList) {
        meta.breadcrumb.parentsList = parentsList
      }
      if (utils) {
        meta.breadcrumb.utils = utils
      }

      this.$_vue2Crumbs_eventBUS.$emit('breadcrumbChanged')

      return meta.breadcrumb
    }

    function $vue2CrumbsCheckMatchedRoutes () {
      if (this.$breadcrumb) {
        [...this.$route.matched].reverse().forEach(route => {
          if (isEqual(route.instances.default, this)) return $vue2CrumbsDispatchNewValue.call(this, route.meta)
        })
      }
    }

    Vue.prototype.$_vue2Crumbs_eventBUS = new Vue()

    Vue.component(Breadcrumbs.name, Breadcrumbs)

    Vue.mixin({
      beforeCreate () {
        if (typeof this.$options.breadcrumb === 'function') {
          if (typeof this.$options.computed === 'undefined') {
            this.$options.computed = {}
          }
          this.$options.computed.$breadcrumb = this.$options.breadcrumb
        }
      },
      watch: {
        $route () {
          $vue2CrumbsCheckMatchedRoutes.call(this)
        },
        $breadcrumb: {
          handler () {
            $vue2CrumbsCheckMatchedRoutes.call(this)
          },
          immediate: true
        }
      }
    })
  }
}

export default vue2Crumbs

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(vue2Crumbs)
}
