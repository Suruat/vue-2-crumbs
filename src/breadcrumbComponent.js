import get from 'lodash/get'

const utils = {
  isObject (checkMe) {
    return typeof checkMe === 'object'&& !Array.isArray(checkMe) && checkMe !== null
  }
}

export default {
  name: 'app-breadcrumbs',
  template: `
    <ul
      class="breadcrumbs-container"
      :is="container"
      v-if="$router"
    >
      <template v-if="parentRoutes.length">
        <template v-for="route in parentRoutes">
          <slot :to="route.to" :label="route.label" :utils="route.utils">
            <li class="parent-breadcrumb">
              <router-link
                :to="route.to"
                exact
              >
                {{route.label}}
              </router-link>
            </li>
          </slot>
        </template>
      </template>

      <li v-if="!isInitialEmptyRoute" class="current-breadcrumb">
        <slot name="current" :label="getRouteLabel(currentRoute)">
          <a>
            {{getRouteLabel(currentRoute)}}
          </a>
        </slot>
      </li>
    </ul>
  `,
  props: {
    container: {
      type: String,
      default: 'ul'
    }
  },
  data () {
    return {
      parentsDynamicRoutes: [],
      parentHelper: ''
    }
  },
  computed: {
    isInitialEmptyRoute () {
      return this.$route.fullPath === '/' && !this.$route.matched.length
    },
    currentRoute () {
      // This check is just to make sure that '$forceUpdate' would work
      if (!this.isInitialEmptyRoute && (this.parentHelper || !this.parentHelper)) {
        return this.$route
      }
    },
    parentRoutes () {
      if (!this.isInitialEmptyRoute) {
        return this.parentsDynamicRoutes.length
          ? this.parentsDynamicRoutes
          : this.getAncestorsRoutesArray(this.currentRoute)
      }
      return []
    }
  },
  // TODO: Write docs for each method
  methods: {
    // Function returns resolved page's breadcrumb property
    getBreadcrumb (route) {
      let breadcrumb = route.meta.breadcrumb
      const matchedRouteRecord = route.matched[route.matched.length - 1]
      const matchedComponent = matchedRouteRecord.components.default
      let componentBreadcrumb

      // TODO: do a normal check for typescript-developed component
      // Check is matched component made with typescript
      if (typeof matchedComponent === 'function' && !!matchedComponent.super) {
        componentBreadcrumb = matchedComponent.options.breadcrumb
      } else {
        componentBreadcrumb = matchedComponent.breadcrumb
      }

      if (componentBreadcrumb && typeof componentBreadcrumb !== 'function') {
        if (breadcrumb && typeof breadcrumb == 'object') {
          breadcrumb = Object.assign(breadcrumb, componentBreadcrumb)
        } else {
          breadcrumb = componentBreadcrumb
        }
      }

      return breadcrumb
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
      const breadcrumb = this.getBreadcrumb(route)
      const breadcrumbLabel = this.getBreadcrumbLabel(breadcrumb)

      if (breadcrumbLabel) {
        routeLabel = breadcrumbLabel
      }

      return routeLabel
    },

    // Function resolves a utils object of the provided route
    getRouteUtils (route) {
      const breadcrumb = this.getBreadcrumb(route)
      if (breadcrumb && breadcrumb.utils) {
        return breadcrumb.utils
      }
    },

    resolveRootParentRoute (parentRouteRecord) {
      const parentRoutePath = parentRouteRecord.path || '/'

      return this.$router.resolve({path: parentRoutePath}).route
    },

    getRootParentRoute (route) {
      let rootParentRoute
      const matchedRoutes = route.matched

      // If second matched route is not the same with current route, return it as next parent
      rootParentRoute = this.resolveRootParentRoute(matchedRoutes[matchedRoutes.length - 2])

      // If second matched route is the same with current route, return route after next as parent
      if (route.path === rootParentRoute.path) {
        rootParentRoute = this.resolveRootParentRoute(matchedRoutes[matchedRoutes.length - 3])
      }

      return rootParentRoute
    },

    getDirectParentRoute (route) {
      const breadcrumb = this.getBreadcrumb(route)

      if (breadcrumb && breadcrumb.parent) {
        const breadcrumbParent = breadcrumb.parent
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
      const directParentRoute = this.getDirectParentRoute(route)

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
      const parentRoute = this.getParentRoute(route)

      if (parentRoute) {
        const {path, name, params, query, hash} = parentRoute
        const routeObjectToAdd = {
          to: {path, name, params, query, hash},
          label: this.getRouteLabel(parentRoute),
          utils: this.getRouteUtils(parentRoute)
        }

        parentRoutesArray = [...this.getAncestorsRoutesArray(parentRoute), routeObjectToAdd]
      }

      return parentRoutesArray
    }
  },
  watch: {
    '$route' (newRoute) {
      // Set or clear component's 'parentsDynamicRoutes' property on each route change
      this.parentsDynamicRoutes = [...get(newRoute, 'meta.breadcrumb.parentsList', [])].reverse()
    }
  },
  created () {
    // Listen to the change of route breadcrumb object
    this.$_vue2Crumbs_eventBUS.$on('breadcrumbChanged', () => {
      const metaBreadcrumb = this.$route.meta.breadcrumb

      if (metaBreadcrumb.parentsList) {
        this.parentsDynamicRoutes = [...metaBreadcrumb.parentsList].reverse()
      }
      if (metaBreadcrumb.parent) {
        this.parentHelper = metaBreadcrumb.parent
      }
      this.$forceUpdate()
    })
  }
}
