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
          :key="route.label"
        >
          <slot :to="route.to" :label="route.label">
            <router-link
              :to="route.to"
              exact
            >
              {{route.label}}
            </router-link>
          </slot>
        </li>
      </template>

      <li class="current-breadcrumb">
        <slot name="current" :label="getRouteLabel(currentRoute)">
          <a>
            {{getRouteLabel(currentRoute)}}
          </a>
        </slot>
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

    resolveRootParentRoute (parentRouteRecord) {
      let parentRoutePath = parentRouteRecord.path || '/'

      return this.$router.resolve({path: parentRoutePath}).route
    },

    getRootParentRoute (route) {
      let rootParentRoute
      let matchedRoutes = route.matched

      // If second matched route is not the same with current route, return it as next parent
      rootParentRoute = this.resolveRootParentRoute(matchedRoutes[matchedRoutes.length - 2])

      // If second matched route is the same with current route, return route after next as parent
      if (route.path === rootParentRoute.path) {
        rootParentRoute = this.resolveRootParentRoute(matchedRoutes[matchedRoutes.length - 3])
      }

      return rootParentRoute
    },

    getDirectParentRoute (route) {
      let breadcrumb = route.meta.breadcrumb
      let componentBreadcrumb = this.getMatchedComponentBreadcrumb(route)

      if (componentBreadcrumb && typeof componentBreadcrumb !== 'function') {
        breadcrumb = componentBreadcrumb
      }

      if (breadcrumb && breadcrumb.parent) {
        let breadcrumbParent = breadcrumb.parent
        let routeResolveObject

        if (breadcrumbParent && breadcrumb.parentsList) {
          console.warn(`Vue-2-Crumbs Warning: You have both 'parent' and 'parentsList' properties for route '${route.name}'!\nPlease, use just one of these per route. By default Vue-2-Crumbs plugin use 'parent' property.`);
        }

        if (typeof breadcrumbParent === 'string') {
          routeResolveObject = {name: breadcrumbParent}
        } else if (utils.isObject(breadcrumbParent)) {
          routeResolveObject = breadcrumbParent
        } else {
          console.error(`Vue-2-Crumbs Error: 'parent' property in breadcrumb object for '${route.name}' route has wrong type. Only string or object is allowed`);
        }

        return this.$router.resolve(routeResolveObject).route
      }
    },

    // Function resolve a parent route if such exist
    getParentRoute (route) {
      let parentRoute
      let directParentRoute = this.getDirectParentRoute(route)

      // Check if component has breadcrumb object
      if (directParentRoute) {
        parentRoute = directParentRoute
      } else if (route.matched && route.matched.length > 1) {
        // Get Default Route Parent (if sub-routing uses)
        parentRoute = this.getRootParentRoute(route)
      }

      return parentRoute
    },

    // Function returns array of parents routes
    getAncestorsRoutesArray (route) {
      let parentRoutesArray = []
      let parentRoute = this.getParentRoute(route)

      if (parentRoute) {
        let {path, name, params, query, hash} = parentRoute
        let routeObjectToAdd = {
          to: {path, name, params, query, hash},
          label: this.getRouteLabel(parentRoute)
        }

        parentRoutesArray = [...this.getAncestorsRoutesArray(parentRoute), routeObjectToAdd]
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
