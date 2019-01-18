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

    // Function return label from any breadcrumb property
    getBreadcrumbLabel (breadcrumb) {
      if (typeof breadcrumb === 'object') {
        if (typeof breadcrumb.label === 'function') return breadcrumb.label.call(this)
        else return breadcrumb.label
      }
    },

    // Function resolves a label of the provided route
    getRouteLabel (route) {
      if (this.getBreadcrumbLabel(this.getBreadcrumb(route))) return this.getBreadcrumbLabel(this.getBreadcrumb(route))
      else return route.name
    },

    // Function resolves a utils object of the provided route
    getRouteUtils (route) {
      if (this.getBreadcrumb(route) && this.getBreadcrumb(route).hasOwnProperty('utils')) return this.getBreadcrumb(route).utils
    },

    resolveRootParentRoute (parentRouteRecord) {
      return this.$router.resolve({ path: (typeof parentRouteRecord === 'object') ? parentRouteRecord.path : '/' }).route
    },

    getRootParentRoute (route) {
      let rootParentRoute
      const matchedRoutes = route.matched
      const regExp = new RegExp(`^(${route.path})(/)?$`)

      if (route.hasOwnProperty('matched')) {
        // If second matched route is not the same with current route, return it as next parent
        rootParentRoute = this.resolveRootParentRoute(matchedRoutes[matchedRoutes.length - 2])

        // If second matched route is the same with current route, return route after next as parent
        if (regExp.test(rootParentRoute.path)) {
          rootParentRoute = this.resolveRootParentRoute(matchedRoutes[matchedRoutes.length - 3])
        }

        return rootParentRoute.name
      }
    },

    // Function returns resolved page's breadcrumb property
    getBreadcrumb (route) {
      let breadcrumb
      if (route.hasOwnProperty('meta') && route.meta.hasOwnProperty('breadcrumb')) breadcrumb = route.meta.breadcrumb

      return breadcrumb
    },

    getDirectParentRoute (route) {
      if (this.getBreadcrumb(route) && this.getBreadcrumb(route).hasOwnProperty('parent')) return this.getBreadcrumb(route).parent
    },

    // Function resolve a parent route if such exist
    getParentRoute (route) {
      return this.getDirectParentRoute(route) ? this.getDirectParentRoute(route) : this.getRootParentRoute(route)
    },

    // Function returns array of parents routes
    getAncestorsRoutesArray (route) {
      let parentRoutesArray = []

      if (this.getParentRoute(route)) {
        const resolvedParentRoute = this.$router.resolve({ name: this.getParentRoute(route) })
        const { path, name, params, query, hash } = resolvedParentRoute.resolved
        const routeObjectToAdd = {
          to: { path, name, params, query, hash },
          label: this.getRouteLabel(resolvedParentRoute.resolved),
          utils: this.getRouteUtils(resolvedParentRoute.resolved)
        }

        if (this.getParentRoute(resolvedParentRoute.resolved) !== this.getParentRoute(route)) {
          parentRoutesArray = [...this.getAncestorsRoutesArray(resolvedParentRoute.resolved), routeObjectToAdd]
        } else {
          parentRoutesArray.push(routeObjectToAdd)
        }
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
