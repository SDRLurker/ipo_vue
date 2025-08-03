<template>
  <div v-if="loading" class="loading-message">IPO 데이터 로딩 중...</div>
  <div v-else-if="error" class="error-message">오류: {{ error }}</div>
  <div v-else class="calendar-container">
    <FullCalendar
      :options="calendarOptions"
      class="full-calendar-custom"
    />
    <div class="month-notes-container">
      <h3>{{ currentMonthNotesTitle }}</h3>
      <div v-if="monthNotesLoading" class="loading-message">월별 특이사항 로딩 중...</div>
      <div v-else-if="monthNotesError" class="error-message">특이사항 로딩 오류: {{ monthNotesError }}</div>
      <div v-else-if="currentMonthNotes" v-html="currentMonthNotes" class="month-notes-content"></div>
      <div v-else class="no-notes-message">해당 월의 특이사항이 없습니다.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { useRouter } from 'vue-router'; // Vue Router 임포트

const loading = ref(true);
const error = ref(null);
const supabase = inject('supabase');
const events = ref([]);
const router = useRouter(); // useRouter 훅 사용

// 월별 특이사항 관련 상태 변수
const currentMonthNotes = ref(null);
const monthNotesLoading = ref(false);
const monthNotesError = ref(null);
const currentMonthNotesTitle = ref(''); // 현재 월 특이사항 제목

// FullCalendar 옵션 설정
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: koLocale,
  weekends: false, // 주말 숨기기
  events: events, // events ref를 직접 전달
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  views: {
    dayGridMonth: {
      dayMaxEvents: false, // 모든 이벤트 표시
      fixedWeekCount: false,
    },
  },
  eventOrder: 'id',
  eventContent: (arg) => {
    const event = arg.event;
    if (event.extendedProps.type === '휴일') {
      return { html: `<div class="fc-event-item fc-event-holiday-label">${event.title}</div>` };
    } else if (event.extendedProps.type === '청약') {
      // 청약 이벤트는 div로 래핑하고, 클릭은 eventClick에서 처리
      return { html: `<div class="fc-event-item fc-event-subscription">[청약] ${event.title}</div>` };
    } else if (event.extendedProps.type === '상장') {
      // 상장 이벤트는 기존과 동일하게 <a> 태그 사용
      return { html: `<a href="${event.url}" target="_blank" class="fc-event-item fc-event-listing">[상장] ${event.title}</a>` };
    }
    return { html: `<div class="fc-event-default">${event.title}</div>` };
  },
  eventClick: (info) => {
    const event = info.event;
    if (event.extendedProps.type === '청약') {
      // 청약 이벤트 클릭 시 /date/yyyy-mm-dd 형식으로 라우팅
      const eventDate = event.startStr.split('T')[0]; // '2025-07-03T...' 에서 '2025-07-03'만 추출
      router.push(`/date/${eventDate}`);
      console.log('청약 이벤트 클릭, 라우팅:', `/date/${eventDate}`);
      info.jsEvent.preventDefault(); // 기본 이벤트 동작 방지 (필요하다면)
    } else if (event.extendedProps.type === '상장') {
      // 상장 이벤트는 <a> 태그의 기본 동작에 의해 링크 이동
      console.log('상장 이벤트 클릭 (링크 이동):', event.title);
    } else {
      info.jsEvent.preventDefault();
    }
  },
  dateClick: (info) => {
    console.log('날짜 클릭:', info.dateStr);
  },
  // --- 새로운 부분 시작 ---
  datesSet: (dateInfo) => {
    // 캘린더의 날짜 범위가 변경될 때마다 호출
    const currentViewDate = dateInfo.view.currentStart; // 현재 뷰의 시작 날짜
    const year = currentViewDate.getFullYear();
    const month = (currentViewDate.getMonth() + 1).toString().padStart(2, '0');
    currentMonthNotesTitle.value = `${year}년 ${month}월 특이사항`; // 제목 업데이트
    fetchMonthSpecificNotes(year, month);
  },
  // --- 새로운 부분 끝 ---
});

const fetchDataFromSupabase = async (tableName, ids = [], idColumn = 'id', orderByColumn = 'id', ascending = true, filters = {}) => {
  loading.value = true;
  error.value = null;
  try {
    let query = supabase.from(tableName).select('*');
    if (ids.length > 0) query = query.in(idColumn, ids);
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        query = query.eq(key, filters[key]);
      }
    }
    query = query.order(orderByColumn, { ascending });
    const { data, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    return data || [];
  } catch (err) {
    error.value = err.message;
    console.error(`Error fetching data from ${tableName}:`, err.message);
    return null;
  } finally {
    loading.value = false;
  }
};

const fetchEvents = async () => {
  const fetchedEvents = await fetchDataFromSupabase(
    'event', [], 'id', 'date', true
  );
  if (fetchedEvents && fetchedEvents.length > 0) {
    events.value = fetchedEvents.map(event => ({
      id: event.id,
      title: event.name,
      start: event.date,
      end: event.date,
      allDay: true,
      url: "https://finance.naver.com/item/main.naver?code="+event.secuID,
      extendedProps: {
        type: event.type,
      }
    }));
  } else {
    events.value = [];
  }
};

// --- 새로운 함수 추가 시작 ---
const fetchMonthSpecificNotes = async (year, month) => {
  monthNotesLoading.value = true;
  monthNotesError.ref = null;
  currentMonthNotes.value = null; // 기존 내용 초기화

  const filePath = `/${year}${month}.html`; // 예: /202507.html
  console.log(`월별 특이사항 파일 로딩 시도: ${filePath}`);

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      if (response.status === 404) {
        console.log('해당 월의 특이사항 파일이 없습니다:', filePath);
        // 파일이 없을 경우 에러로 처리하지 않고, 내용을 비워둡니다.
        currentMonthNotes.value = null;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } else {
      currentMonthNotes.value = await response.text();
    }
  } catch (err) {
    console.error('월별 특이사항 로딩 중 오류 발생:', err);
    monthNotesError.value = `월별 특이사항을 불러오는 데 실패했습니다: ${err.message}`;
  } finally {
    monthNotesLoading.value = false;
  }
};
// --- 새로운 함수 추가 끝 ---

onMounted(() => {
  fetchEvents();
  // 컴포넌트 마운트 시 초기 월의 특이사항 로드 (FullCalendar의 initialView에 맞춰)
  const today = new Date();
  const initialYear = today.getFullYear();
  const initialMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  currentMonthNotesTitle.value = `${initialYear}년 ${initialMonth}월 특이사항`;
  fetchMonthSpecificNotes(initialYear, initialMonth);
});

watch(events, (newEvents) => {
  // 이벤트 업데이트 로직 (events ref 변경 시 FullCalendar 자동 업데이트)
});
</script>
<style>
/* 캘린더 컨테이너 스타일 */
.calendar-container {
  max-width: 70%;
  margin: 0 auto;
}

/* FullCalendar 전체 스타일 조정 */
.full-calendar-custom {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 캘린더 헤더 (월 이동, 타이틀 등) */
.fc .fc-toolbar-title {
  font-size: 1.8em;
  font-weight: 700;
  color: #333;
}

.fc .fc-button-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 1.0em;
  transition: background-color 0.2s ease;
}

.fc .fc-button-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

/* fc-theme-standard 클래스의 테두리 제거 (대부분 이 클래스가 원인) */
.fc .fc-theme-standard {
  border: none !important; /* <--- 이 부분을 추가합니다. */
}

/* 요일 헤더 */
.fc-theme-standard th {
  background-color: #f8f9fa;
  color: #555;
  font-weight: bold;
  font-size: 1.5em;
  padding: 10px 0;
}

/* 각 셀의 경계선을 원한다면 별도로 설정 */
.fc .fc-daygrid-body,
.fc .fc-daygrid-day {
  border: none !important; /* <--- 셀 사이의 border를 없앨 때 사용 */
}

/* 날짜 셀 */
.fc .fc-daygrid-day-frame {
  min-height: 100px;
}

.fc .fc-daygrid-day-top {
  padding: 8px;
}

.fc-daygrid-day-number {
  font-size: 1.1em;
  font-weight: bold;
  color: #333;
}

/* 현재 날짜 셀 강조 */
.fc .fc-day-today {
  background-color: #e6f7ff !important;
  border-radius: 5px;
}

/* 현재 달력 범위 밖의 날짜 스타일 */
.fc .fc-day-other .fc-daygrid-day-number {
  color: #bbb;
}

.fc .fc-day-other {
  background-color: #f5f5f5;
}

/* 이벤트 스타일 */
.fc-event-main {
  font-size: 1.0em;
}

/* 휴일 라벨 */
.fc-event-holiday-label {
  background-color: #dc3545; /* 빨간색 배경 */
  color: white; /* 글자색 흰색 */
  border: none;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 1.0em;
  font-weight: bold;
  display: inline-block;
}

/* 기존 .fc-event-button 대신 사용할 클래스 추가 */
.fc-event-item {
  width: 100%;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 1.0em; /* 변경: 글씨 크기 키움 */
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  box-sizing: border-box;
  margin-bottom: 2px;
  text-decoration: none;
}

.fc-event-subscription {
  background-color: #28a745;
  color: white;
  transition: background-color 0.2s ease;
}

.fc-event-subscription:hover {
  background-color: #218838;
}

.fc-event-listing {
  background-color: #007bff;
  color: white;
  transition: background-color 0.2s ease;
}

.fc-event-listing:hover {
  background-color: #0056b3;
}

/* 기본 이벤트 스타일 (명시적으로 처리하지 않은 경우) */
.fc-event-default {
  background-color: #6c757d;
  color: white;
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 1.0em; /* 변경: 글씨 크기 키움 */
  border: none; /* 변경: 테두리 흰색으로 */
}

/* 더 많은 이벤트 표시 (+N more) 스타일 */
.fc-daygrid-more-link {
  color: #007bff;
  font-weight: bold;
  text-decoration: none;
  font-size: 0.8em;
}

.fc-daygrid-more-link:hover {
  text-decoration: underline;
}

/* 월별 특이사항 컨테이너 */
.month-notes-container {
  margin-top: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
}

.month-notes-container h3 {
  font-size: 1.6em;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.month-notes-content {
  line-height: 1.8;
  color: #555;
  font-size: 1.1em;
  text-align: left; /* 본문 내용을 왼쪽 정렬 */
}

.no-notes-message, .loading-message, .error-message {
  text-align: left; /* 본문 내용을 왼쪽 정렬 */
  color: #777;
  padding: 10px;
  font-style: italic;
}

.error-message {
  color: #dc3545;
  font-weight: bold;
}
</style>
