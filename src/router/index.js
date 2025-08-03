import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import IpoGroup from '../components/IpoGroup.vue';
import SubTable from '../components/SubTable.vue';


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/date/:date', // ':date' 부분이 라우트 파라미터입니다.
      name: 'IpoGroup',
      component: IpoGroup,
      props: true // 파라미터를 컴포넌트 props로 전달하려면 필요하지만, 여기서는 useRoute를 직접 사용
    },
    {
      path: '/cal',
      name: 'Calendar',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/CalView.vue'),
    },
  ],
})

export default router
