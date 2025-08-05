<template>
  <div class="ipo-container">
    <div v-if="ipo" class="ipo-details-table">
      <table>
        <thead>
          <tr>
            <th class="title">청약단위</th>
            <th class="title">청약증거금</th>
            <th class="title">배정비례주식수</th>
            <th v-if="ipo.ratep" class="title">예상비례주식수</th>
            <th class="title">등급</th>
          </tr>
        </thead>
        <tbody v-if="ipo.units">
          <tr v-for="unit in ipo.units.unit_arr" :key="unit">
            <td>{{ unit.toLocaleString() }}</td>
            <td>{{ (unit * ipo.price * ipo.margin).toLocaleString() }}</td>
            <td>{{ (unit / ipo.rate2) }}</td>
            <td v-if="ipo.ratep">{{ (unit / ipo.ratep) }}</td>
            <td>{{ getLevel(unit) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="not-found-message">
      조견표 데이터를 표시할 수 없습니다.
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

// props를 정의합니다. ipo-id 대신 ipo-data 객체를 직접 받습니다.
const props = defineProps({
  ipoData: {
    type: Object,
    required: true
  }
});

// prop을 직접 사용하는 것보다 computed로 한번 감싸면 가독성과 유지보수성이 향상됩니다.
const ipo = computed(() => props.ipoData);

// getLevel 함수는 이제 내부 computed 변수인 ipo를 사용합니다.
const getLevel = (unit) => {
  if (ipo.value && ipo.value.units && ipo.value.units.level) {
    return ipo.value.units.level[unit] || "";
  }
  return "";
};

// Supabase 관련 로직 (inject, ref, onMounted, onUnmounted 등)은 모두 제거되었습니다.
</script>

<style scoped>
/* 스타일 부분은 변경 없습니다 */
/*
 * 아래 CSS 스타일은 이 컴포넌트에만 적용됩니다 (scoped 속성).
 * 이미지와 유사한 표 스타일을 구현합니다.
 */
.ipo-container {
  font-family: 'Nanum Gothic', '나눔 고딕';
  text-align: center;
  max-width: 800px; /* 전체 컨테이너 너비 */
  margin: 30px auto;
  padding: 25px;
  /*
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  */
}

.ipo-title {
  font-size: 2em;
  color: #333;
  margin-bottom: 30px;
  text-align: left; /* 제목 왼쪽 정렬 */
  padding-bottom: 10px;
  border-bottom: 2px solid #ccc;
}

/* 로딩, 에러, 데이터 없음 메시지 스타일 */
.loading-message, .error-message, .not-found-message {
  padding: 20px;
  font-weight: bold;
}
.loading-message { color: #2980b9; } /* 로딩 메시지 색상 */
.error-message { color: #c0392b; } /* 에러 메시지 색상 */
.not-found-message { color: #666; } /* 데이터 없음 메시지 색상 */

/* IPO 상세 정보를 담는 테이블 컨테이너 */
.ipo-details-table {
  width: 100%;
  /* border-collapse는 table 자체에 적용 */
}

.ipo-details-table table {
  width: 100%;
  border-collapse: collapse; /* 테이블 셀 간의 여백 제거 */
}

/* 모든 테이블 셀 (th, td) 기본 스타일 */
.ipo-details-table th,
.ipo-details-table td {
  border: 1px solid #ddd; /* 셀 테두리 */
  padding: 12px 15px; /* 셀 내부 여백 */
  vertical-align: middle; /* 내용 수직 가운데 정렬 */
  text-align: center; /* 기본 텍스트 가운데 정렬 */
}

/* 라벨 컬럼 스타일 (왼쪽 회색 배경) */
.ipo-details-table td.label {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #555;
  width: 30%; /* 라벨 컬럼 너비 */
}

/* 값 컬럼 스타일 (오른쪽 흰색 배경) */
.ipo-details-table td.value {
  background-color: #fff;
  color: #333;
  width: 35%; /* 값 컬럼 너비 (오른쪽 패널이 없으면 더 넓어짐) */
}

.title {
  font-weight: bold;
  color: #ffffff;
  background-color: #4285f4;
}
</style>
