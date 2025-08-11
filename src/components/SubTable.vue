<template>
  <div class="ipo-container">
    <div v-if="ipo" class="ipo-details-table">
      <form>
        <fieldset>
          <input type="checkbox" id="main-calculation" v-model="isMainCalculationEnabled" />
          <label for="main-calculation"><b>본전계산기능</b></label>
        </fieldset>
        <fieldset class="form-section">
          <legend class="visually-hidden">계산 옵션</legend>
          <div class="option-group">
            <label>환불기간: {{ipo.refund_days}}일</label>
          </div>
          <div class="option-group">
            <label>예상값으로 계산: </label>
            <div class="radio-group-reflect">
              <input
                type="checkbox"
                id="is-predicted"
                v-model="isPredicted"
                :disabled="!ipo.ratep"
              />
              <label for="is-predicted">체크시 예상값</label>
            </div>
          </div>
          <div class="option-group">
            <label>청약수수료:</label>
            <div class="radio-group">
              <input type="radio" id="commission-no" value="no" v-model="commissionOption" name="commission-option" />
              <label for="commission-no">안냄</label>
              <input type="radio" id="commission-yes" value="yes" v-model="commissionOption" name="commission-option" />
              <label for="commission-yes">냄</label>
            </div>
          </div>
          <div class="option-group">
            <label>균등배정: {{ fair_cnt }}주 </label>
            <div class="radio-group-reflect">
              <input
                type="checkbox"
                id="is-reflected"
                v-model="isReflected"
              />
              <label for="is-reflected">반영함</label>
            </div>
            <div class="radio-group-calc" v-if="isReflected">
              <input type="radio" id="equal-down" value="down" v-model="equalDistributionOption" name="equal-distribution-type" />
              <label for="equal-down">내림</label>
              <input type="radio" id="equal-up" value="up" v-model="equalDistributionOption" name="equal-distribution-type" />
              <label for="equal-up">올림</label>
              <input type="radio" id="equal-round" value="round" v-model="equalDistributionOption" name="equal-distribution-type" />
              <label for="equal-round">반올림</label>
              <input type="radio" id="equal-custom" value="custom" v-model="equalDistributionOption" name="equal-distribution-type" />
              <label for="equal-custom">사용자정의</label>
              <input
                type="number"
                v-model="customEqualDistributionValue"
                :disabled="equalDistributionOption !== 'custom'"
                class="text-input"
                min="0.0" max="1.0"
              />
              <label>을 포함하여 올림</label>
            </div>
          </div>
          <div class="option-group">
            <label>CMA 이자:</label>
            <div class="input-group">
              <input type="number" v-model="cmaInterestValue" class="text-input" min="0.0" max="20.0"/>
              <label>이상</label>
            </div>
          </div>
          <div class="option-group">
            <label>비례배정:</label>
            <div class="radio-group">
              <input type="radio" id="proportional-custom" value="custom" v-model="proportionalDistributionOption" name="proportional-distribution" />
              <label for="proportional-custom">사용자정의</label>
            </div>
            <div class="input-group">
              <input type="number" v-model="customProportionalDistributionValue" :disabled="proportionalDistributionOption !== 'custom'" class="text-input" min="0.0" max="1.0"/>
              <label>을 포함하여 올림</label>
            </div>
          </div>
        </fieldset>
      </form>
      <table>
        <thead>
          <tr>
            <th class="title">청약단위</th>
            <th class="title">청약증거금</th>
            <th class="title">배정비례주식수</th>
            <th v-if="ipo.ratep" class="title">예상비례주식수</th>
            <th v-if="isMainCalculationEnabled" class="title">본전가격</th>
            <th class="title">등급</th>
          </tr>
        </thead>
        <tbody v-if="ipo.units">
          <tr v-for="unit in ipo.units.unit_arr" :key="unit">
            <td>{{ unit.toLocaleString() }}</td>
            <td>{{ (unit * ipo.price * ipo.margin).toLocaleString() }}</td>
            <td>{{ (unit / ipo.rate2) }}</td>
            <td v-if="ipo.ratep">{{ (unit / ipo.ratep) }}</td>
            <th v-if="isMainCalculationEnabled"> {{ caculatePrice(unit, unit * ipo.price * ipo.margin, unit / (isPredicted && ipo.ratep ? ipo.ratep : ipo.rate2)) }}</th>
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
import { computed, defineProps, ref, watch } from 'vue';

const props = defineProps({
  ipoData: {
    type: Object,
    required: true
  }
});

const ipo = computed(() => props.ipoData);

const getLevel = (unit) => {
  if (ipo.value && ipo.value.units && ipo.value.units.level) {
    return ipo.value.units.level[unit] || "";
  }
  return "";
};

const isPredicted = ref(false); // 예상값으로 계산 체크박스
const isMainCalculationEnabled = ref(false); // 본전계산기능 체크박스
const commissionOption = ref('no'); // 청약수수료 라디오 버튼
const cmaInterestValue = ref('2.4'); // CMA 이자 텍스트 필드
const proportionalDistributionOption = ref('custom'); // 비례배정 라디오 버튼
const customProportionalDistributionValue = ref('0.6'); // 비례배정 사용자정의 텍스트 필드

// '반영 여부'를 위한 불리언 변수 (체크박스)
const isReflected = ref(true);
// '내림/올림/반올림/사용자정의' 옵션을 위한 변수
const equalDistributionOption = ref('down'); // 초기값 설정
// '사용자정의' 입력 필드를 위한 변수
const customEqualDistributionValue = ref('0.6');

const fair_cnt = ref(0);

const updateFairCnt = () => {
    if (ipo.value) {
        fair_cnt.value = (ipo.value.assign / 2.0 / (isPredicted.value && ipo.value.countp ? ipo.value.countp : ipo.value.count)).toFixed(2);
    }
};

// ipo.value 또는 isPredicted가 변경될 때 fair_cnt를 업데이트
watch([ipo, isPredicted], updateFairCnt, { immediate: true });

const round2 = (num, r) => {
  const decimalPart = num - Math.floor(num);
  let integerValue;
  if (decimalPart < r) {
    integerValue = 0; // 버림
  } else {
    integerValue = 1; // 올림
  }
  return Math.floor(num) + integerValue;
}

/**
 * CMA 일복리 세후 이자만 계산하는 함수
 * @param {number} principal - 입금액 (원금)
 * @param {number} annualRate - 연이자율 (%)
 * @param {number} days - 예치 기간 (일)
 * @returns {number} 계산된 세후 이자
 */
const calculatePosttaxInterest = (principal, annualRate, days) => {
  const rate = annualRate / 100;
  const dailyRate = rate / 365;
  let currentBalance = principal;
  for (let i = 0; i < days; i++) {
    currentBalance += currentBalance * dailyRate;
  }
  const pretaxInterest = currentBalance - principal;
  const taxRate = 0.154;
  const tax = pretaxInterest * taxRate;
  const posttaxInterest = pretaxInterest - tax;
  return Math.round(posttaxInterest);
}

const caculatePrice = (unit, price, rate) => {
  const commission = commissionOption.value === 'yes' ? ipo.value.fee : 0;
  var rate_cnt = 0;
  var cnt = 0;
  var interest = 0;

  if (isMainCalculationEnabled.value) {
    if (isReflected.value) {
      var DistNum = parseFloat(customEqualDistributionValue.value);
      if (DistNum < 0.0 || DistNum >= 1.0) {
        DistNum = 0.6;
        customEqualDistributionValue.value = "0.6";
      }

      const totalShares = isPredicted.value && ipo.value.assignp ? ipo.value.assignp : ipo.value.assign;
      const totalCount = isPredicted.value && ipo.value.countp ? ipo.value.countp : ipo.value.count;
      const fairCntValue = totalShares / 2.0 / totalCount;

      if (equalDistributionOption.value === 'down') {
        fair_cnt.value = Math.floor(fairCntValue);
      } else if (equalDistributionOption.value === 'up') {
        fair_cnt.value = Math.ceil(fairCntValue);
      } else if (equalDistributionOption.value === 'round') {
        fair_cnt.value = Math.round(fairCntValue);
      } else {
        fair_cnt.value = round2(fairCntValue, DistNum);
      }
    } else {
      fair_cnt.value = 0;
    }

    const interest_rate = parseFloat(cmaInterestValue.value);
    interest = calculatePosttaxInterest(price, interest_rate, ipo.value.refund_days);
    var rateNum = parseFloat(customProportionalDistributionValue.value);
    if (rateNum < 0.0 || rateNum >= 1.0) {
      rateNum = 0.6;
      customProportionalDistributionValue.value = "0.6";
    }

    rate_cnt = round2(rate, rateNum);
    cnt = fair_cnt.value + rate_cnt;

    if (cnt === 0) {
      return 0;
    }

    const result = (ipo.value.price * cnt + commission + interest) / cnt;
    return result.toFixed(0);
  }
  return 0;
};
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

.form-container {
  border: 1px solid #ccc;
  padding: 20px;
  max-width: 600px;
  margin: 20px auto;
}
fieldset {
  border: none;
  padding: 0;
  margin: 0 0 20px 0;
}
legend {
  font-weight: bold;
  padding: 0 5px;
}
.form-section {
  border: 1px solid #ccc;
  padding: 10px;
}
.option-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.radio-group,
.input-group {
  display: flex;
  align-items: center;
  gap: 5px;
}
.text-input {
  width: 50px;
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
