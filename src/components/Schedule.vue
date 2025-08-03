<template>
  <div>
    <div class="navigation-buttons">
      <button @click="goToPreviousWeek" :disabled="!isPreviousWeekAvailable">이전 주</button>
      <button @click="goToNextWeek" :disabled="!isNextWeekAvailable">다음 주</button>
    </div>

    <div v-if="scheduleHtmlContent" v-html="scheduleHtmlContent"></div>
    <div v-else>
      <p>이번 주 주식 청약 상장 일정을 불러오는 중이거나, 데이터가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import weekData from '@/assets/week.json';

const scheduleHtmlContent = ref('');
const currentMonday = ref(''); // 현재 보여주고 있는 주의 월요일 날짜를 저장

const isPreviousWeekAvailable = ref(false);
const isNextWeekAvailable = ref(false);

// 현재 주의 월요일을 계산하는 함수 (시작 날짜로 사용)
const getMondayOfDate = (date) => {
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 0 (일)요일일 경우 이전 주로 처리 (-6), 아니면 현재 주 월요일 (1)

  const monday = new Date(date.setDate(diff));

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// HTML 파일을 불러오는 비동기 함수
const fetchSchedule = async (dateString) => {
  const filePath = `${dateString}.html`;
  console.log('Fetching file from:', filePath);

  try {
    const response = await fetch(filePath);
    const responseText = await response.text();

    console.log('Fetch response status:', response.status);
    console.log('Fetch response OK:', response.ok);
    console.log('Received HTML content (first 100 chars):', responseText.substring(0, 100));

    if (!response.ok || (responseText.length < 50 && responseText.trim() === '') || responseText.startsWith('<!DOCTYPE html>')) {
      let errorMessage = `일정을 불러오지 못했습니다. 파일이 없거나 내용이 비어있습니다. (요청 URL: ${filePath}, 상태: ${response.status})`;
      if (!response.ok) {
        errorMessage = `파일을 찾을 수 없거나 서버 오류: ${filePath} (Status: ${response.status})`;
      }
      scheduleHtmlContent.value = `<p style="color: red;">${errorMessage}</p>`;
      console.warn(errorMessage);
    } else {
      scheduleHtmlContent.value = responseText;
    }
  } catch (error) {
    console.error('주간 스케줄 HTML 파일을 불러오는 데 실패했습니다:', error);
    scheduleHtmlContent.value = `<p style="color: red;">일정을 불러오는 데 문제가 발생했습니다: ${error.message}</p>`;
  }
};

// 이전 주 보기
const goToPreviousWeek = () => {
  const current = new Date(currentMonday.value);
  current.setDate(current.getDate() - 7); // 7일 전으로 설정
  currentMonday.value = getMondayOfDate(current);
};

// 다음 주 보기
const goToNextWeek = () => {
  const current = new Date(currentMonday.value);
  current.setDate(current.getDate() + 7); // 7일 후로 설정
  currentMonday.value = getMondayOfDate(current);
};

const isPrevious = () => {
  const current = new Date(currentMonday.value);
  current.setDate(current.getDate() - 7); // 7일 전으로 설정
  return week in getMondayOfDate(current);
}

// 현재 주가 변경될 때마다 week.json을 기반으로 이전/다음 주의 파일 존재 여부를 확인하는 함수
const updateNavigationButtonStates = (mondayDateString) => {
  const current = new Date(mondayDateString);

  // 이전 주 날짜 계산
  const prevWeekDate = new Date(current);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevMondayString = getMondayOfDate(prevWeekDate);

  // 다음 주 날짜 계산
  const nextWeekDate = new Date(current);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextMondayString = getMondayOfDate(nextWeekDate);

  // weekData에서 해당 날짜 키의 존재 여부 확인
  isPreviousWeekAvailable.value = !!weekData[prevMondayString]; // true/false로 변환
  isNextWeekAvailable.value = !!weekData[nextMondayString];   // true/false로 변환
};

// 컴포넌트 마운트 시 초기 주간 일정 로드
onMounted(() => {
  currentMonday.value = getMondayOfDate(new Date()); // 오늘 날짜 기준으로 현재 주 월요일 설정
  fetchSchedule(currentMonday.value);
  updateNavigationButtonStates(currentMonday.value);
});

// currentMonday 값이 변경될 때마다 새로운 일정 로드
watch(currentMonday, (newMonday) => {
  fetchSchedule(newMonday);
  updateNavigationButtonStates(newMonday);
}, { immediate: true }); // immediate: true를 사용하여 컴포넌트 초기 로드 시에도 watch가 즉시 실행되도록 함
</script>

<style scoped>
.navigation-buttons {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.navigation-buttons button {
  padding: 8px 15px;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f0f0f0;
}

.navigation-buttons button:hover {
  background-color: #e0e0e0;
}
</style>
