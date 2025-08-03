<template>
  <div class="ipo-container">

    <div v-if="loading" class="loading-message">IPO 데이터 로딩 중...</div>
    <div v-else-if="error" class="error-message">오류: {{ error }}</div>

    <div v-else-if="groupedIpos && Object.keys(groupedIpos).length > 0" class="ipo-details-table-merged">
      <div v-for="([eventId, group], index) in groupedIpoEntries" :key="eventId" class="ipo-group-table">
        <table>
          <thead>
            <tr>
              <th :class="index === 0 ? 'label-header-merged' : 'label-placeholder-th-merged'"></th>
              <th :colspan="group.items.length + (group.items.length > 1 ? 1 : 0)" class="group-title">
                {{ events[index].name }} ({{ (events[index].day_num || 0) }}일차)
              </th>
            </tr>
            <tr>
              <th :class="index === 0 ? 'label-header' : 'label-placeholder-th'">증권사</th>
              <th v-for="item in group.items" :key="item.id" class="secu-header">
                {{ getSecuritiesName(item.secu_id) }}
              </th>
              <th v-if="group.items.length > 1" class="total-header">합계</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">공모가</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ item.price }}</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">(최소단위)</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">
                {{ item.min }}주 / {{ (item.min * item.price * item.margin) }}원
              </td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">수수료/당일개설청약</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">
                {{ item.fee }}원 / {{ item.able ? '가능' : '불가능' }}
              </td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">청약건수</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ item.count }}</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">{{ group.total.count }}</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">현재 통합경쟁률</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ item.rate1 }}</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">{{ group.total.rate1.toFixed(2) }}</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">현재 비례경쟁률</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell" :class="{ 'red-text': item.rate2 > group.total.rate2 }">
                {{ item.rate2 }}
              </td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
              <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">균등배정 주식 수</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ uniformAssignmentShares(item) }}</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">배정주식수</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ item.assign }}</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">{{ group.total.assign }}</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">증거금율</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ (item.margin * 100).toFixed(0) }}%</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">총 청약 증거금(억원)</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">{{ totalMarginBillion(item) }}</td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">{{ totalMarginBillion(group.total) }}</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">업데이트 시간</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">
                {{ item.update ? new Date(item.update).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '' }}
              </td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
            <tr>
              <td :class="index === 0 ? 'label-cell' : 'label-placeholder-td'">조견표</td>
              <td v-for="item in group.items" :key="item.id" class="data-cell">
                <button @click="toggleItem(item.id, events[index])">
                  {{ selectedItemId === item.id ? '닫기' : '열기' }}
                </button>
              </td>
              <td v-if="group.items.length > 1" class="data-cell total-cell">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
    <div v-else-if="!loading && !error" class="not-found-message">
      IPO 데이터를 찾을 수 없습니다.
    </div>
  </div>
  <div v-if="selectedIpo" class="details-container">
    <div class="detail-section">
      <h1>{{selectedEvent.name.split('-')[0]}} {{ getSecuritiesName(selectedIpo.secu_id) }} 시간표</h1>
      <IPOTime :ipo_id="selectedIpo.id" :assign="selectedIpo.assign" :key="selectedIpo.id"/>
    </div>
    <div class="detail-section">
      <h1>{{selectedEvent.name.split('-')[0]}} {{ getSecuritiesName(selectedIpo.secu_id) }} 조견표</h1>
      <SubTable :ipo-data="selectedIpo" :key="selectedIpo.id"/>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed, watch, defineProps } from 'vue';
import { useRoute } from 'vue-router';
import allSecurities from '@/assets/securities.json';
import SubTable from './SubTable.vue';
import IPOTime from './IPOTime.vue';

const supabase = inject('supabase');
const route = useRoute();
const ipos = ref([]);
const events = ref([]);
const groupedIpos = ref({});
const loading = ref(true);
const error = ref(null);
const groupedIpoEntries = computed(() => Object.entries(groupedIpos.value));

const securities = ref(allSecurities);
const eventIdsToFetch = ref([]);

defineProps({
  date: String
});

const selectedEvent = ref(null);
const selectedItemId = ref(null);
const toggleItem = (id, event) => {
  selectedEvent.value = event;
  selectedItemId.value = selectedItemId.value === id ? null : id;
};

// --- 여기부터 수정/추가된 부분입니다 ---

// 선택된 ID에 해당하는 전체 IPO 객체를 찾는 computed 속성
const selectedIpo = computed(() => {
  if (!selectedItemId.value) return null;
  // ipos 배열에서 실시간으로 업데이트되는 객체를 찾습니다.
  return ipos.value.find(item => item.id === selectedItemId.value);
});

// --- 여기까지 수정/추가된 부분입니다 ---

let ipoChannel = null;

const totalMarginBillion = (ipoItem) => {
  if (!ipoItem || !ipoItem.price || !ipoItem.rate1 || !ipoItem.assign || !ipoItem.margin) return 0;
  const rawValue = (ipoItem.price * ipoItem.rate1 * ipoItem.assign * ipoItem.margin) / 100000000;
  return parseFloat(rawValue.toFixed(2));
};

const uniformAssignmentShares = (ipoItem) => {
  if (!ipoItem || !ipoItem.assign || !ipoItem.count) return '0.00';
  const assign = ipoItem.assign;
  const count = ipoItem.count;
  if (count === 0) return '0.00';
  return ((assign / 2.0) / count).toFixed(2);
};

const getSecuritiesName = (secuId) => securities.value[String(secuId)] || '알 수 없음';

const getEventName = (eventId) => {
  const event = events.value.find(e => e.id === parseInt(eventId));
  return event ? event.name : '알 수 없음';
};

const groupAndCalculateTotals = (data) => {
  const groups = {};

  data.forEach(item => {
    const eventId = item.event_id;
    if (!eventId) return;

    if (!groups[eventId]) {
      groups[eventId] = {
        eventName: '',
        day: 0,
        items: [],
        total: {
          price: 0,
          count: 0,
          rate1: 0,
          assign: 0,
          margin: 0,
          totalMarginBillion: 0,
        }
      };
    }
    if (groups[eventId].items.length === 0) {
      groups[eventId].total.price = item.price;
    }
    groups[eventId].items.push(item);
    groups[eventId].total.count += item.count;
    groups[eventId].total.assign += item.assign;
    groups[eventId].total.rate1 += (item.rate1 * item.assign);
  });

  for (const eventId in groups) {
    const group = groups[eventId];
    if (group.items.length > 0) {
      group.total.rate1 = group.total.rate1 / group.total.assign;
      group.total.margin = group.items[0].margin;
      group.total.totalMarginBillion = group.items.reduce((sum, item) => sum + parseFloat(totalMarginBillion(item)), 0);
    }
  }
  return groups;
};

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

const fetchAllIpos = async (eventIdsToFilter = []) => {
  const ipoData = await fetchDataFromSupabase('ipo', eventIdsToFilter, 'event_id', 'id', true);
  if (ipoData) {
    ipos.value = ipoData;
    groupedIpos.value = groupAndCalculateTotals(ipos.value);
  }
};

const fetchAndSetEventIds = async () => {
  const specificDate = route.params.date;
  const eventType = '청약';
  if (!specificDate) {
    error.value = "URL에서 날짜 파라미터를 찾을 수 없습니다.";
    loading.value = false;
    return;
  }
  const fetchedEvents = await fetchDataFromSupabase(
    'event', [], 'id', 'id', true, { date: specificDate, type: eventType }
  );
  if (fetchedEvents && fetchedEvents.length > 0) {
    events.value = fetchedEvents;
    eventIdsToFetch.value = fetchedEvents.map(event => event.id);
  } else {
    // 이 부분에서는 error를 설정하지 않고, 데이터가 없는 상태로 둘 수 있습니다.
    // loadIpoData에서 최종적으로 처리합니다.
    events.value = [];
    eventIdsToFetch.value = [];
  }
};

let reconnectTimeout = null;
const subscribeToIpoChanges = () => {
  if (ipoChannel) {
    return;
  }

  if (eventIdsToFetch.value.length === 0) {
    console.warn('구독할 event IDs가 없어 WebSocket 구독을 건너뜁니다.');
    return;
  }

  const channelName = `ipo_realtime:${route.params.date}`;
  ipoChannel = supabase.channel(channelName, {
    config: {
      broadcast: {
        self: true,
      },
    },
  });

  ipoChannel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ipo',
      filter: `event_id=in.(${eventIdsToFetch.value.join(',')})`
    }, (payload) => {
      const eventId = payload.new?.event_id || payload.old?.event_id;
      if (!eventIdsToFetch.value.includes(eventId)) return;

      const { eventType, new: newData, old: oldData } = payload;
      if (eventType === 'INSERT') {
        ipos.value.push(newData);
      } else if (eventType === 'UPDATE') {
        const index = ipos.value.findIndex(item => item.id === newData.id);
        if (index !== -1) {
          // ✅ 해결 방법: 객체를 교체하는 대신 기존 객체의 속성을 업데이트합니다.
          Object.assign(ipos.value[index], newData);
        } else {
          ipos.value.push(newData);
        }
      } else if (eventType === 'DELETE') {
        ipos.value = ipos.value.filter(item => item.id !== oldData.id);
      }
      groupedIpos.value = groupAndCalculateTotals(ipos.value);
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        error.value = null;
        console.log(`성공적으로 채널(${channelName})에 연결되었습니다.`);
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      } else if (status === 'CHANNEL_ERROR') {
        // 수정된 부분: err 객체가 undefined일 경우를 대비하여 안전하게 접근
        const errorMessage = err?.message || '알 수 없는 오류';
        console.error('채널 연결 오류가 발생했습니다. 전체 콜백 정보:', { status: status, error: err });
        error.value = `실시간 데이터 연결에 실패했습니다. (원인: ${errorMessage}) 3초 후 재시도합니다.`;

        if(ipoChannel) {
          supabase.removeChannel(ipoChannel);
          ipoChannel = null;
        }
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          subscribeToIpoChanges();
        }, 3000);

      } else if (status === 'TIMED_OUT') {
        console.warn('채널 연결 시간 초과. 재연결을 시도합니다.');
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(() => {
          subscribeToIpoChanges();
        }, 3000);
      }
    });
};

const loadIpoData = async () => {
  loading.value = true;
  error.value = null;
  ipos.value = [];
  groupedIpos.value = {};

  // 기존 채널 정리
  if (ipoChannel) {
    try {
      await ipoChannel.unsubscribe();
      supabase.removeChannel(ipoChannel);
    } catch (e) {
      console.warn('이전 채널 제거 중 오류 발생:', e);
    } finally {
      ipoChannel = null;
    }
  }

  await fetchAndSetEventIds();

  if (eventIdsToFetch.value.length > 0) {
    await fetchAllIpos(eventIdsToFetch.value);
    subscribeToIpoChanges();
  } else {
    // 데이터가 없는 경우, 로딩 상태를 끄고 메시지를 표시합니다.
    loading.value = false;
    // groupedIpos.value를 비워두면 template에서 '찾을 수 없습니다' 메시지가 표시됩니다.
  }
};

onMounted(() => {
  loadIpoData();
});

watch(
  () => route.params.date,
  (newDate, oldDate) => {
    if (newDate && newDate !== oldDate) {
      loadIpoData();
    }
  },
  { immediate: false } // 페이지 첫 로딩은 onMounted에서 처리하므로 immediate는 false로 둡니다.
);

onUnmounted(() => {
  if (ipoChannel) {
    ipoChannel.unsubscribe().catch(err => console.error("Unsubscribe failed", err));
    supabase.removeChannel(ipoChannel).catch(err => console.error("Remove channel failed", err));
    ipoChannel = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
});
</script>


<style scoped>
/* 스타일(style) 부분은 변경되지 않았으므로 그대로 사용하시면 됩니다. */
.ipo-container {
  overflow-x: auto; /* 테이블이 화면 너비를 넘으면 스크롤 허용 */
}

.loading-message, .error-message, .not-found-message {
  padding: 20px;
  font-weight: bold;
  color: #555;
}
.loading-message { color: #2980b9; }
.error-message { color: #c0392b; }

/* 그룹화된 IPO 테이블 컨테이너 */
.ipo-details-table-merged {
  display: flex;
  flex-wrap: nowrap; /* 넘칠 경우 줄바꿈 방지 */
  gap: 0;          /* 테이블 간 간격 */
  overflow-x: auto;  /* 가로 스크롤 허용 */
  margin-bottom: 20px; /* Optional: 전체 병합된 테이블 블록 아래 여백 */
}

.ipo-group-table {
  flex: 1 1 auto; /* 내용에 따라 테이블이 늘어나고 줄어들도록 허용하지만, 최소 너비로 재정의될 수 있습니다. */
  border: none;
  border-right: 1px solid #ccc; /* 테이블 사이에 경계선 추가 */
}

.ipo-group-table:last-child {
  border-right: none; /* 마지막 테이블에는 경계선 없음 */
}

.ipo-group-table table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto; /* 내용에 따라 열 크기를 조정하도록 허용 */
}

.ipo-group-table th,
.ipo-group-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 12px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap; /* 가능한 한 내용을 한 줄에 유지 */
  height: 50px; /* 모든 셀의 높이를 고정하여 정렬 유지 */
  box-sizing: border-box; /* 패딩과 테두리를 높이에 포함 */
}

/* 그룹 제목 (맨 위 병합된 셀) */
.ipo-group-table .group-title {
  background-color: #4285f4;
  color: #ffffff;
  font-size: 1.2em;
  font-weight: bold;
  padding: 15px;
}

/* 병합된 제목 행의 왼쪽 첫 번째 빈 헤더 셀 */
.ipo-group-table .label-header-merged {
  background-color: #4285f4; /* 그룹 제목과 동일한 배경 */
  border-right: none; /* 오른쪽 경계선 제거 */
  width: 150px; /* 'label-header' 및 'label-cell'과 일치하도록 너비 조정 */
  min-width: 150px; /* 줄어들지 않도록 보장 */
  text-align: left;
}

/* '증권사' 헤더 (두 번째 헤더 행의 첫 번째 열) */
.ipo-group-table .label-header {
  background-color: #f0f0f0;
  font-weight: bold;
  color: #333;
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 10;
  width: 150px; /* 필요에 따라 너비 조정 */
  min-width: 150px; /* 줄어들지 않도록 보장 */
}

/* 증권사 헤더 */
.ipo-group-table .secu-header {
  background-color: #e6f0ff;
  color: #1a73e8;
  font-weight: bold;
}

/* 합계 헤더 */
.ipo-group-table .total-header {
  background-color: #d1e7dd; /* 초록색 */
  color: #28a745;
  font-weight: bold;
}

/* 항목 레이블 셀 (각 데이터 행의 첫 번째 셀) */
.ipo-group-table .label-cell {
  background-color: #f8f8f8;
  font-weight: bold;
  color: #555;
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 5;
  width: 150px; /* label-header와 일치하도록 너비 조정 */
  min-width: 150px; /* 줄어들지 않도록 보장 */
}

/* 일반 데이터 셀 */
.ipo-group-table .data-cell {
  background-color: #fff;
  color: #333;
}

/* 합계 데이터 셀 */
.ipo-group-table .total-cell {
  background-color: #f1fafa; /* 합계 열 배경 */
  font-weight: bold;
  color: #218838;
}

/* 특정 값 강조 (예: 높은 비례 경쟁률) */
.ipo-group-table .red-text {
  color: #dc3545; /* 빨간색 */
  font-weight: bold;
}

/* 마우스 호버 효과 */
.ipo-group-table tbody tr:hover {
  background-color: #f5f5f5;
}
.ipo-group-table tbody tr:hover td {
  background-color: #f5f5f5;
}
.ipo-group-table tbody tr:hover .label-cell {
  background-color: #f5f5f5; /* 고정된 레이블 셀도 호버 시 색상 변경 */
}

.label-placeholder-th-merged,
.label-placeholder-th,
.label-placeholder-td {
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important; /* 경계선 제거 */
  font-size: 0 !important;
  line-height: 0 !important;
  height: auto !important; /* 행에 따라 높이 조절 후 내용 숨김 */
  overflow: hidden !important;
  visibility: hidden !important;
  box-sizing: border-box;
}

.ipo-group-table:first-child .label-header {
  width: 200px;
  min-width: 200px;
}
.ipo-group-table:first-child .label-cell {
  width: 200px;
  min-width: 200px;
}

.details-container {
  display: flex;
  flex-direction: row;
  gap: 20px; /* 시간표와 조견표 사이 간격 */
  padding: 15px;
  background-color: #f7f9fc;
}

.detail-section {
  flex: 1; /* 두 섹션이 공간을 균등하게 차지하도록 */
  min-width: 0; /* flex item이 줄어들 수 있도록 */
}

.detail-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #4285f4;
  padding-bottom: 8px;
}
</style>
