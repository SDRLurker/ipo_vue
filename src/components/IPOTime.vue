<template>
  <!-- HTML 테이블을 사용하여 안정적인 레이아웃을 구현 -->
  <table class="ipo-details-table">
    <!-- 헤더 부분 -->
    <thead>
      <tr>
        <th>시간</th>
        <th>청약자수</th>
        <th>통합경쟁률</th>
        <th>비례경쟁률</th>
        <th>균등주식배정수</th>
      </tr>
    </thead>

    <!-- 바디 부분 -->
    <tbody>
      <tr v-if="loading" class="loading-row">
        <td colspan="5">데이터를 불러오는 중...</td>
      </tr>
      <tr v-else-if="error" class="error-row">
        <td colspan="5">오류: {{ error }}</td>
      </tr>
      <template v-else-if="ipo_times && ipo_times.length > 0">
        <tr v-for="item in ipo_times" :key="item.id">
          <td>{{ new Date(item.time).toLocaleTimeString('ko-KR') }}</td>
          <td>{{ item.count }}</td>
          <td>{{ item.rate1 }}</td>
          <td>{{ item.rate2 }}</td>
          <!-- 0으로 나누기 방지 -->
          <td>{{ item.count > 0 ? (assign / 2 / item.count).toFixed(2) : '0' }}</td>
        </tr>
      </template>
      <tr v-else>
        <td colspan="5">시간표 데이터가 없습니다.</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed, defineProps, ref, onMounted, onUnmounted, watch, inject } from 'vue';

const props = defineProps({
  ipo_id: {
    type: Number,
    required: true
  },
  assign: {
    type: Number,
    required: true
  }
});

const ipo_id = computed(() => props.ipo_id);
const assign = computed(() => props.assign);

const supabase = inject('supabase');

const reconnectTimeout = ref(null);
const ipoChannel = ref(null);
const loading = ref(true);
const error = ref(null);
const ipo_times = ref([]);

const cleanupChannel = async () => {
  if (ipoChannel.value) {
    try {
      // ✅ unsubscribe() 만으로 충분하며 가장 안전합니다.
      await ipoChannel.value.unsubscribe();
      console.log(`채널 (${ipoChannel.value.topic}) 구독 해제 완료.`);

      // 🚨 문제의 원인이었던 removeChannel 코드를 완전히 삭제합니다.
      // await supabase.removeChannel(ipoChannel.value);

    } catch (err) {
      console.error("채널 구독 해제 실패", err);
    } finally {
      ipoChannel.value = null;
    }
  }
  if (reconnectTimeout.value) {
    clearTimeout(reconnectTimeout.value);
    reconnectTimeout.value = null;
  }
};

const subscribeToIpoTimesChanges = () => {
  if (ipoChannel.value) {
    return;
  }

  if (!ipo_id.value) {
    console.warn('ipo_id가 없어 WebSocket 구독을 건너뜁니다.');
    return;
  }

  const channelName = `ipo_time_realtime:${ipo_id.value}`;
  ipoChannel.value = supabase.channel(channelName, {
    config: {
      broadcast: {
        self: true,
      },
    },
  });

  console.log("subscribeToIpoTimesChanges");
  console.log(ipoChannel.value);
  ipoChannel.value
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ipo_time',
      filter: `ipo_id=eq.${ipo_id.value}`
    }, (payload) => {
      const { eventType, new: newData, old: oldData } = payload;
      console.log('디버그: 실시간 데이터 변경 감지', { eventType, newData, oldData });

      if (eventType === 'INSERT') {
        ipo_times.value.push(newData);
      } else if (eventType === 'UPDATE') {
        const index = ipo_times.value.findIndex(item => item.id === newData.id);
        if (index !== -1) {
          ipo_times.value[index] = newData;
        } else {
          ipo_times.value.push(newData);
        }
      } else if (eventType === 'DELETE') {
        ipo_times.value = ipo_times.value.filter(item => item.id !== oldData.id);
      }
      // 시간순으로 정렬
      ipo_times.value.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        error.value = null;
        if (reconnectTimeout.value) {
          clearTimeout(reconnectTimeout.value);
          reconnectTimeout.value = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const errorMessage = err?.message || '알 수 없는 오류';
        error.value = `실시간 데이터 연결에 실패했습니다. (원인: ${errorMessage}) 3초 후 재시도합니다.`;
        if (ipoChannel.value) {
          supabase.removeChannel(ipoChannel.value);
          ipoChannel.value = null;
        }
        if (reconnectTimeout.value) clearTimeout(reconnectTimeout.value);
        reconnectTimeout.value = setTimeout(() => {
          subscribeToIpoTimesChanges();
        }, 3000);
      }
    });
};

const loadIpoTimeData = async () => {
  loading.value = true;
  error.value = null;
  ipo_times.value = [];

  cleanupChannel();

  if (ipo_id.value) {
    try {
      const { data, error: fetchError } = await supabase
        .from('ipo_time')
        .select('*')
        .eq('ipo_id', ipo_id.value)
        .order('time', { ascending: true });

      if (fetchError) throw fetchError;

      ipo_times.value = data;
    } catch (err) {
      error.value = `초기 데이터 로딩 중 오류 발생: ${err.message}`;
    } finally {
      loading.value = false;
      subscribeToIpoTimesChanges();
    }
  } else {
    loading.value = false;
  }
};

onMounted(() => {
  console.log('디버그: IPOTime 컴포넌트가 성공적으로 마운트되었습니다.');
  console.log("IPOTime 마운트됨: ", ipo_id.value, assign.value);
  console.log('[183]현재 Supabase 채널 목록:', supabase.getChannels().map(ch => ch.topic));
  if (props.ipo_id) {
    loadIpoTimeData();
  }
});

watch(
  () => props.ipo_id,
  async (newVal) => {
    if (newVal) {
      await loadIpoTimeData();
    } else {
      await cleanupChannel();
      ipo_times.value = [];
      loading.value = false;
    }
  },
);

onUnmounted(() => {
  cleanupChannel();
  console.log('[203]현재 Supabase 채널 목록:', supabase.getChannels().map(ch => ch.topic));
});
</script>

<style scoped>
/*
 * 부모의 <td> 안에 렌더링되므로, CSS 충돌을 최소화하도록
 * 독립적인 테이블 스타일을 적용합니다.
 */

.debug-panel {
  width: 100%;
  background-color: #ffebee;
  color: #c0392b;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ef5350;
  font-size: 12px;
  white-space: pre-wrap;
  text-align: left;
  box-sizing: border-box;
}

.ipo-details-table {
  width: 100%;
  border-collapse: collapse;
}

.ipo-details-table th,
.ipo-details-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  word-break: break-all;
}

.ipo-details-table thead {
  background-color: #4285f4;
  color: white;
  font-weight: bold;
}

.ipo-details-table tbody tr:nth-child(even) {
  background-color: #f2f2f2;
}

.ipo-details-table tbody tr:hover {
  background-color: #ddd;
}

.loading-row td, .error-row td {
  padding: 20px;
  font-weight: bold;
  color: #666;
  background-color: #f9f9f9;
}

.error-row td {
  color: #c0392b;
}

</style>
