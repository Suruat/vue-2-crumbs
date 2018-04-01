const utils = {}
utils.isObject = checkMe => {
  return typeof checkMe === 'object'&& !Array.isArray(checkMe) && checkMe !== null
}

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
            {{route.label || getRouteLabel(route)}}
          </router-link>
        </li>
      </template>

      <li class="current-breadcrumb">
        <a>
          {{getRouteLabel(currentRoute)}}
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
             : this.getAncestorsRoutesArray(this.currentRoute)
    }
  },
  // TODO: Write docs for each method
  methods: {
    // Function returns component's breadcrumb property
    getMatchedComponentBreadcrumb (route) {
      let matchedRouteRecord = route.matched[route.matched.length - 1]
      let matchedComponent = matchedRouteRecord.components.default

      return matchedComponent.breadcrumb
    },

    // Function return label from any breadcrumb property
    getBreadcrumbLabel (breadcrumb) {
      if (typeof breadcrumb === 'object') {
        return breadcrumb.label
      }
      if (typeof breadcrumb === 'string') {
        return breadcrumb
      }
    },

    // Function resolves a label of the provided route
    getRouteLabel (route) {
      let routeLabel = route.name
      let breadcrumb = route.meta.breadcrumb
      let componentBreadcrumb = this.getMatchedComponentBreadcrumb(route)

      if (componentBreadcrumb && typeof componentBreadcrumb !== 'function') {
        breadcrumb = componentBreadcrumb
      }

      let breadcrumbLabel = this.getBreadcrumbLabel(breadcrumb)
      if (breadcrumbLabel) {
        routeLabel = breadcrumbLabel
      }

      return routeLabel
    },
    resolveDefaultParentRoute (parentRouteRecord) {
      let parentRoutePath = parentRouteRecord.path || '/'

      return this.$router.resolve({path: parentRoutePath}).route
    },
    getDefaultParentRoute (route) {
      let defaultParentRoute
      let matchedRoutes = route.matched

      // If second matched route is not the same with current route, return it as next parent
      defaultParentRoute = this.resolveDefaultParentRoute(matchedRoutes[matchedRoutes.length - 2])

      // If second matched route is the same with current route, return route after next as parent
      if (route.path === defaultParentRoute.path) {
        defaultParentRoute = this.resolveDefaultParentRoute(matchedRoutes[matchedRoutes.length - 3])
      }

      return defaultParentRoute
    },
    getComponentParents (route) {
      // TODO: fix bug when route having parentsList doesn't show in crumbs itself
      let breadcrumb = route.meta.breadcrumb
      let componentBreadcrumb = this.getMatchedComponentBreadcrumb(route)

      if (componentBreadcrumb && typeof componentBreadcrumb !== 'function') {
        breadcrumb = componentBreadcrumb
      }

      if (breadcrumb) {
        // return breadcrumb.parent
        //       ? this.$router.resolve({name: breadcrumb.parent}).route
        //       : breadcrumb.parentsList
        let ancestors = breadcrumb.parentsList
        let breadcrumbParent = breadcrumb.parent

        if (breadcrumbParent && breadcrumb.parentsList) {
          console.warn(`Vue-2-Crumbs Warning: You have both 'parent' and 'parentsList' properties for route '${route.name}'!\nPlease, use just one of these per route. By default Vue-2-Crumbs plugin use 'parent' property.`);
        }

        if (breadcrumbParent) {
          let routeResolveObject
          if (typeof breadcrumbParent === 'string') {
            routeResolveObject = {name: breadcrumbParent}
          } else if (utils.isObject(breadcrumbParent)) {
            routeResolveObject = breadcrumbParent
          } else {
            console.error(`Vue-2-Crumbs Error: 'parent' property in breadcrumb object for '${route.name}' route has wrong type. Only string or object is allowed`);
          }

          ancestors = this.$router.resolve(routeResolveObject).route
        }
        return ancestors
      }
    },

    // Function resolve a parent route if such exist
    getParentRoute (route) {
      // Check if component has breadcrumb object
      let parentsRoutes = this.getComponentParents(route)
      if (parentsRoutes) {
        return parentsRoutes
      }

      // Return Default Route Parent (if sub-routing uses)
      if (route.matched && route.matched.length > 1) {
        return this.getDefaultParentRoute(route)
      }
    },

    // Function returns array of parents routes
    getAncestorsRoutesArray (route) {
      let parentRoutesArray = []
      let parentRoute = this.getParentRoute(route)

      // If parentRoute is Array, than it comes from 'parents' property in component's breadcrumb and needs to be handled properly
      if (Array.isArray(parentRoute)) {
        parentRoutesArray = parentRoute

      // If parentRoute exist and isn't array, add it to parents routes array
      } else if (parentRoute) {
        parentRoutesArray = [...this.getAncestorsRoutesArray(parentRoute), parentRoute]
      }

      return parentRoutesArray
    }
  },
  watch: {
    '$route' () {
      // Set empty component's 'parentsDynamicRoutes' property on each route change
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
