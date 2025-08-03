<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/">홈</router-link> |
        <router-link :to="'/date/' + today_str">오늘 청약</router-link> |
        <router-link to="/cal">달력</router-link> |
        <a href="https://docs.google.com/spreadsheets/d/18BZ2HBN010C9GmoNOBWu0ddzOECp73-Q0DFTwxey8gU/edit?usp=sharing" target="_blank">청약 정보</a> |
        <a href="https://sdr1982.tistory.com/guestbook" target="_blank">방명록</a> //
        <a href="https://sdrlurker.notion.site/166d1dff257980d3a8e8c71e5c022e81" target="_blank">해외 양도세 프로그램</a>
      </nav>
    </header>

    <router-view />
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed, watch, defineProps } from 'vue';
const today_str = computed( () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

/* 추가 스타일 (옵션) */
nav {
  margin-bottom: 20px;
}
nav a {
  font-weight: bold;
  color: #2c3e50;
  padding: 0 10px;
}
nav a.router-link-exact-active {
  color: #42b983;
}
</style>
