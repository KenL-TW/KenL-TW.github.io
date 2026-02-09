/**
 * 對話歷史與反饋追蹤系統
 * 用於記錄、分析與改進 chatbot 回應精準度
 */

class ConversationLogger {
  constructor() {
    this.currentConversationId = this.generateConversationId();
    this.sessionStartTime = new Date();
    this.messages = [];
    this.isEnabled = true;
    this.storageMethod = 'localStorage'; // 可改為 'indexeddb' 或 'remote-api'
  }

  generateConversationId() {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(7);
    return `conv-${date}-${random}`;
  }

  /**
   * 記錄一個對話回合
   */
  logMessage(turn, userQuery, aiResponse, sourcesUsed = [], retrievalMethod = 'keyword_match') {
    if (!this.isEnabled) return;

    const message = {
      turn,
      user_query: userQuery,
      timestamp: new Date().toISOString(),
      ai_response: aiResponse,
      sources_used: sourcesUsed.map(src => ({
        chunk_id: src.chunk_id || '',
        relevance_score: src.relevance_score || 0,
        path: src.path || '',
        retrieval_method: retrievalMethod
      })),
      user_feedback: null
    };

    this.messages.push(message);
    this.persistConversation();
  }

  /**
   * 記錄用戶反饋（點讚 / 點踩 / 評分）
   */
  addFeedback(turnIndex, feedback) {
    if (turnIndex >= 0 && turnIndex < this.messages.length) {
      this.messages[turnIndex].user_feedback = {
        helpful: feedback.helpful,
        rating: feedback.rating || (feedback.helpful ? 5 : 1),
        feedback_text: feedback.text || '',
        timestamp: new Date().toISOString()
      };
      this.persistConversation();
    }
  }

  /**
   * 持久化對話記錄
   */
  persistConversation() {
    const conversationData = {
      conversation_id: this.currentConversationId,
      session_metadata: {
        started_at: this.sessionStartTime.toISOString(),
        ended_at: new Date().toISOString(),
        user_device: this.detectDevice(),
        message_count: this.messages.length
      },
      messages: this.messages,
      quality_metrics: this.calculateQualityMetrics()
    };

    if (this.storageMethod === 'localStorage') {
      try {
        const key = `chatbot-conv-${this.currentConversationId}`;
        localStorage.setItem(key, JSON.stringify(conversationData));
      } catch (e) {
        console.warn('Failed to save conversation to localStorage:', e);
      }
    }
  }

  /**
   * 計算對話品質指標
   */
  calculateQualityMetrics() {
    const feedbackedMessages = this.messages.filter(m => m.user_feedback);
    const avgRating = feedbackedMessages.length 
      ? feedbackedMessages.reduce((sum, m) => sum + (m.user_feedback.rating || 0), 0) / feedbackedMessages.length 
      : null;

    const avgRelevance = this.messages.length
      ? this.messages.reduce((sum, m) => {
          const srcRelevance = m.sources_used.length
            ? m.sources_used.reduce((s, src) => s + (src.relevance_score || 0), 0) / m.sources_used.length
            : 0;
          return sum + srcRelevance;
        }, 0) / this.messages.length
      : 0;

    return {
      avg_response_rating: avgRating,
      avg_source_relevance: avgRelevance,
      total_messages: this.messages.length,
      messages_with_feedback: feedbackedMessages.length,
      feedback_rate: feedbackedMessages.length / this.messages.length || 0
    };
  }

  /**
   * 檢測用戶設備
   */
  detectDevice() {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * 獲取本地所有對話記錄
   */
  getAllConversations() {
    const conversations = [];
    if (this.storageMethod === 'localStorage') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chatbot-conv-')) {
          try {
            conversations.push(JSON.parse(localStorage.getItem(key)));
          } catch (e) {
            console.warn(`Failed to parse conversation ${key}:`, e);
          }
        }
      }
    }
    return conversations;
  }

  /**
   * 導出對話記錄為 JSON（用於備份或分析）
   */
  exportConversation(conversationId) {
    const key = `chatbot-conv-${conversationId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * 清除舊對話記錄（超過 N 天）
   */
  cleanupOldConversations(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    if (this.storageMethod === 'localStorage') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('chatbot-conv-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const startedAt = new Date(data.session_metadata.started_at);
            if (startedAt < cutoffDate) {
              keysToRemove.push(key);
            }
          } catch (e) {
            console.warn(`Failed to check conversation age ${key}:`, e);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleaned up ${keysToRemove.length} old conversations`);
    }
  }

  /**
   * 生成分析報告（按日期和主題）
   */
  generateAnalyticsReport() {
    const conversations = this.getAllConversations();
    
    const report = {
      total_conversations: conversations.length,
      total_messages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
      avg_rating: conversations.reduce((sum, c) => {
        const avgRating = c.quality_metrics.avg_response_rating;
        return sum + (avgRating || 0);
      }, 0) / conversations.length,
      top_chunks: this.getTopChunks(conversations),
      common_queries: this.getCommonPatterns(conversations),
      device_distribution: this.getDeviceDistribution(conversations)
    };

    return report;
  }

  getTopChunks(conversations) {
    const chunkUsage = {};
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        msg.sources_used.forEach(src => {
          if (!chunkUsage[src.chunk_id]) {
            chunkUsage[src.chunk_id] = { count: 0, avgRelevance: 0, totalRelevance: 0 };
          }
          chunkUsage[src.chunk_id].count++;
          chunkUsage[src.chunk_id].totalRelevance += src.relevance_score || 0;
        });
      });
    });

    return Object.entries(chunkUsage)
      .map(([id, data]) => ({
        chunk_id: id,
        usage_count: data.count,
        avg_relevance: data.totalRelevance / data.count
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
  }

  getCommonPatterns(conversations) {
    const patterns = {};
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        // 簡單關鍵詞提取
        const words = msg.user_query.toLowerCase().split(/[\s、，,；;.!！？?]+/);
        words.forEach(word => {
          if (word.length > 2) {
            patterns[word] = (patterns[word] || 0) + 1;
          }
        });
      });
    });

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pattern, count]) => ({ pattern, frequency: count }));
  }

  getDeviceDistribution(conversations) {
    const distribution = {};
    conversations.forEach(conv => {
      const device = conv.session_metadata.user_device;
      distribution[device] = (distribution[device] || 0) + 1;
    });
    return distribution;
  }

  /**
   * 上傳對話記錄到遠端伺服器（可選）
   */
  async uploadToServer(serverUrl, apiKey) {
    const conversation = {
      conversation_id: this.currentConversationId,
      session_metadata: {
        started_at: this.sessionStartTime.toISOString(),
        ended_at: new Date().toISOString(),
        user_device: this.detectDevice()
      },
      messages: this.messages,
      quality_metrics: this.calculateQualityMetrics()
    };

    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(conversation)
      });

      if (response.ok) {
        console.log('Conversation uploaded successfully');
      } else {
        console.error('Failed to upload conversation:', response.status);
      }
    } catch (e) {
      console.error('Error uploading conversation:', e);
    }
  }
}

// 全局實例
window.DTZ_CONVERSATION_LOGGER = new ConversationLogger();
