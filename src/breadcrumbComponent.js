export default {
  name: 'app-breadcrumbs',
  template: `
    <ul
      class="breadcrumbs-container"
      v-if="$router"
    >
      <template v-if="parentRoutes.length">
        <li
          class="parent-breadcrumb"
          v-for="route in parentRoutes"
          :key="route.label || route.name"
        >
          <router-link
            :to="route.path"
            exact
          >
            {{route.label || $_vue2Crumbs_getRouteLabel(route)}}
          </router-link>
        </li>
      </template>

      <li class="current-breadcrumb">
        <a>
          {{$_vue2Crumbs_getRouteLabel(currentRoute)}}
        </a>
      </li>
    </ul>
  `,
  data () {
    return {
      parentsDynamicRoutes: [],
      parentHelper: ''
    }
  },
  computed: {
    currentRoute () {
      // This check is just to make sure that '$forceUpdate' would work
      if (this.parentHelper || !this.parentHelper) {
        return this.$route
      }
    },
    parentRoutes () {
      return this.parentsDynamicRoutes.length
             ? this.parentsDynamicRoutes
             : this.$_vue2Crumbs_addParentRoute(this.currentRoute)
    }
  },
  // TODO: Write docs for methods
  methods: {
    $_vue2Crumbs_getMatchedComponentBreadcrumb (route) {
      let matchedRouteRecord = route.matched[route.matched.length - 1]
      let matchedComponent = matchedRouteRecord.components.default
      return matchedComponent.breadcrumb
    },
    $_vue2Crumbs_getBreadcrumbLabel (breadcrumb) {
      if (typeof breadcrumb === 'object') {
        return breadcrumb.label
      }
      if (typeof breadcrumb === 'string') {
        return breadcrumb
      }
    },
    $_vue2Crumbs_getComponentLabel (route) {
      let componentBreadcrumb = this.$_vue2Crumbs_getMatchedComponentBreadcrumb(route)

      if (componentBreadcrumb) {
        if (typeof componentBreadcrumb !== 'function') {
          return this.$_vue2Crumbs_getBreadcrumbLabel(componentBreadcrumb)
        }

        return this.$_vue2Crumbs_getBreadcrumbLabel(route.meta.breadcrumb)
      }
    },
    // Function resolves a label of the provided route
    $_vue2Crumbs_getRouteLabel (route) {
      // Check is breadcrumb object exist in component
      let componentLabel = this.$_vue2Crumbs_getComponentLabel(route)
      if (componentLabel) {
        return componentLabel
      }

      // Check is breadcrumb object exist in route meta
      if (route.meta.breadcrumb) {
        let metaLabel = this.$_vue2Crumbs_getBreadcrumbLabel(route.meta.breadcrumb)
        if (metaLabel) {
          return metaLabel
        }
      }

      // By Default Return Route Name
      return route.name
    },
    $_vue2Crumbs_isSameAsParent (route) {
      let parentRouteRecord = route.matched[route.matched.length - 2]
      let parentRoutePath = parentRouteRecord.path || '/'
      let parentRoute = this.$router.resolve({path: parentRoutePath}).route

      return route.path === parentRoute.path
    },
    $_vue2Crumbs_getDefaultRouteParent (route) {
      // TODO: add handler 'parent' property on route object
      let parentRouteRecord
      let parentRoutePath

      // If second matched route is not the same with current route, return it as next parent route
      if (!this.$_vue2Crumbs_isSameAsParent(route)) {
        parentRouteRecord = route.matched[route.matched.length - 2]
        if (parentRouteRecord) {
          let parentRoutePath = parentRouteRecord.path || '/'
          return this.$router.resolve({path: parentRoutePath}).route
        }

      // If second matched route is the same with current route, return route after next as parent
      } else {
        parentRouteRecord = route.matched[route.matched.length - 3]
        if (parentRouteRecord) {
          parentRoutePath = parentRouteRecord.path || '/'
          return this.$router.resolve({path: parentRoutePath}).route
        }
      }
    },
    $_vue2Crumbs_getComponentParents (route) {
      let componentBreadcrumb = this.$_vue2Crumbs_getMatchedComponentBreadcrumb(route)

      if (componentBreadcrumb) {
        // If breadcrumb property isn't a function, return 'parents' property from it
        if (typeof componentBreadcrumb !== 'function') {
          if (componentBreadcrumb.parent) {
            return this.$router.resolve({name: componentBreadcrumb.parent}).route
          }
          return componentBreadcrumb.parentsList
        }

        // If breadcrumb property is function, get parents from route meta (there plugin stores it)
        if (route.meta.breadcrumb) {
          let metaBreadcrumb = route.meta.breadcrumb
          if (metaBreadcrumb.parent) {
            return this.$router.resolve({name: metaBreadcrumb.parent}).route
          }

          return metaBreadcrumb.parentsList
        }
      }
    },
    // Function resolve a parent route if such exist
    $_vue2Crumbs_getParentRoute (route) {
      // Check is component has breadcrumb object
      let parentsRoutes = this.$_vue2Crumbs_getComponentParents(route)
      if (parentsRoutes) {
        return parentsRoutes
      }

      // If route meta have breadcrumb object and 'parent' propery inside it, get parent route from it
      if (route.meta.breadcrumb && route.meta.breadcrumb.parent) {
        return this.$router.resolve({name: route.meta.breadcrumb.parent}).route
      }

      // Return Default Route Parent (if sub-routing uses)
      if (route.matched && route.matched.length > 1) {
        return this.$_vue2Crumbs_getDefaultRouteParent(route)
      }
    },
    $_vue2Crumbs_addParentRoute (route) {
      let parentRoute = this.$_vue2Crumbs_getParentRoute(route)

      // If parentRoute is Array, than it comes from 'parents' property in component's breadcrumb and needs to be handled properly
      if (Array.isArray(parentRoute)) {
        return parentRoute

      // If parentRoute exist and isn't array, add it to parents routes array
      } else if (parentRoute) {
        return [].concat(this.$_vue2Crumbs_addParentRoute(parentRoute), parentRoute)
      }
      return []
    }
  },
  watch: {
    '$route' () {
      // Set back component 'parentsDynamicRoutes' property on each route change
      this.parentsDynamicRoutes = []
    }
  },
  created () {
    // Listen to the change of route breadcrumb object
    this.$_vue2Crumbs_eventBUS.$on('breadcrumbChanged', () => {
      let metaBreadcrumb = this.$route.meta.breadcrumb

      if (metaBreadcrumb.parentsList) {
        this.parentsDynamicRoutes = metaBreadcrumb.parentsList.reverse()
      }
      if (metaBreadcrumb.parent) {
        this.parentHelper = metaBreadcrumb.parent
      }
      this.$forceUpdate()
    })
  }
}
