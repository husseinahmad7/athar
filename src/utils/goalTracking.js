/**
 * Goal Tracking Utilities
 * Handles different goal types with appropriate reset and tracking logic
 */

/**
 * Check if a daily reset is needed for a goal
 * @param {Object} goal - The goal object
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {boolean} - Whether a reset is needed
 */
export function needsDailyReset(goal, currentDate) {
  if (!goal.last_reset_date) return true;
  return goal.last_reset_date !== currentDate;
}

/**
 * Check if a monthly reset is needed for a goal
 * @param {Object} goal - The goal object
 * @param {string} currentMonth - Current month in YYYY-MM format
 * @returns {boolean} - Whether a reset is needed
 */
export function needsMonthlyReset(goal, currentMonth) {
  if (!goal.current_month) return true;
  return goal.current_month !== currentMonth;
}

/**
 * Check if streak is broken (no activity yesterday)
 * @param {string} lastActivityDate - Last activity date in YYYY-MM-DD format
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {boolean} - Whether streak is broken
 */
export function isStreakBroken(lastActivityDate, currentDate) {
  if (!lastActivityDate) return false;
  
  const last = new Date(lastActivityDate);
  const current = new Date(currentDate);
  const diffTime = current - last;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Streak is broken if more than 1 day has passed
  return diffDays > 1;
}

/**
 * Check if activity already happened today
 * @param {string} lastActivityDate - Last activity date in YYYY-MM-DD format
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {boolean} - Whether activity happened today
 */
export function hasActivityToday(lastActivityDate, currentDate) {
  return lastActivityDate === currentDate;
}

/**
 * Get the current month in YYYY-MM format
 * @param {Date} date - The date object
 * @returns {string} - Month in YYYY-MM format
 */
export function getCurrentMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculate goal progress update based on goal type
 * @param {Object} goal - The goal object
 * @param {number} dhikrCount - Number of dhikr repetitions completed
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {Object} - Updated goal data
 */
export function calculateGoalProgress(goal, dhikrCount, currentDate) {
  const currentMonth = getCurrentMonth(new Date(currentDate));
  const updates = {
    last_activity_date: currentDate
  };

  switch (goal.goal_type) {
    case 'daily_streak': {
      // Daily streak: track consecutive days of completion (any dhikr)
      // target_value = number of consecutive days to achieve
      // current_value = current streak count

      if (hasActivityToday(goal.last_activity_date, currentDate)) {
        // Already counted today, no update needed
        return null;
      }

      if (isStreakBroken(goal.last_activity_date, currentDate)) {
        // Streak broken, reset to 1
        updates.streak_count = 1;
        updates.current_value = 1;
      } else {
        // Continue streak
        updates.streak_count = (goal.streak_count || 0) + 1;
        updates.current_value = updates.streak_count;
      }

      updates.last_reset_date = currentDate;
      updates.is_completed = updates.current_value >= goal.target_value;
      break;
    }

    case 'dhikr_streak': {
      // Dhikr streak: track consecutive days of completing specific dhikr(s)
      // target_value = number of consecutive days to achieve
      // current_value = current streak count
      // Requires dhikr_ids to be set

      if (hasActivityToday(goal.last_activity_date, currentDate)) {
        // Already counted today, no update needed
        return null;
      }

      if (isStreakBroken(goal.last_activity_date, currentDate)) {
        // Streak broken, reset to 1
        updates.streak_count = 1;
        updates.current_value = 1;
      } else {
        // Continue streak
        updates.streak_count = (goal.streak_count || 0) + 1;
        updates.current_value = updates.streak_count;
      }

      updates.last_reset_date = currentDate;
      updates.is_completed = updates.current_value >= goal.target_value;
      break;
    }

    case 'total_count': {
      // Total count: cumulative count across all time
      // target_value = total repetitions to achieve
      // current_value = cumulative count
      
      updates.current_value = (goal.current_value || 0) + dhikrCount;
      updates.is_completed = updates.current_value >= goal.target_value;
      break;
    }

    case 'specific_dhikr':
    case 'combination': {
      // Specific dhikr or combination: cumulative count for specific dhikr(s)
      // target_value = total repetitions to achieve
      // current_value = cumulative count
      
      updates.current_value = (goal.current_value || 0) + dhikrCount;
      updates.is_completed = updates.current_value >= goal.target_value;
      break;
    }

    case 'monthly_target': {
      // Monthly target: count resets every month
      // target_value = repetitions to achieve per month
      // current_value = current month's count
      // monthly_progress = same as current_value
      
      if (needsMonthlyReset(goal, currentMonth)) {
        // New month, reset progress
        updates.monthly_progress = dhikrCount;
        updates.current_value = dhikrCount;
        updates.current_month = currentMonth;
        updates.last_reset_date = currentDate;
      } else {
        // Same month, accumulate
        updates.monthly_progress = (goal.monthly_progress || 0) + dhikrCount;
        updates.current_value = updates.monthly_progress;
      }

      updates.is_completed = updates.current_value >= goal.target_value;
      break;
    }

    default:
      return null;
  }

  return updates;
}

