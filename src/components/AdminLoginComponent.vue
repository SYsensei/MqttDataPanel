<template>
  <div class="admin-login-container">
    <el-dialog
      :title="title"
      v-model="dialogVisible"
      width="300px"
      center
      @close="handleClose">
      <el-form :model="loginForm">
        <el-form-item :label="passwordLabel" required>
          <el-input 
            type="password" 
            v-model="loginForm.password"
            :placeholder="passwordPlaceholder"
            show-password
            @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">{{ cancelText }}</el-button>
          <el-button type="primary" @click="handleLogin">{{ confirmText }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  // 对话框标题
  title: {
    type: String,
    default: '管理员验证'
  },
  // 密码标签
  passwordLabel: {
    type: String,
    default: '密码'
  },
  // 密码占位符
  passwordPlaceholder: {
    type: String,
    default: '请输入管理员密码'
  },
  // 取消按钮文本
  cancelText: {
    type: String,
    default: '取消'
  },
  // 确认按钮文本
  confirmText: {
    type: String,
    default: '确认'
  },
  // 对话框可见性
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['login', 'cancel', 'update:visible']);

// 对话框可见性
const dialogVisible = ref(props.visible);

// 登录表单数据
const loginForm = reactive({
  password: ''
});

// 处理登录
const handleLogin = () => {
  emit('login', loginForm.password);
  loginForm.password = ''; // 清空密码
};

// 处理取消
const handleCancel = () => {
  loginForm.password = ''; // 清空密码
  emit('cancel');
  emit('update:visible', false);
};

// 处理关闭
const handleClose = () => {
  loginForm.password = ''; // 清空密码
  emit('update:visible', false);
};
</script>

<style scoped>
.admin-login-container {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

:deep(.el-dialog) {
  background-color: #132859;
  border: 1px solid #1e3a8a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

:deep(.el-dialog__title) {
  color: #4d77f9;
  font-weight: bold;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #1e3a8a;
  padding-bottom: 15px;
}

:deep(.el-form-item__label) {
  color: #eef2ff;
}

:deep(.el-input__inner) {
  background-color: #0a1a40;
  border: 1px solid #1e3a8a;
  color: #eef2ff;
}

:deep(.el-input__inner:focus) {
  border-color: #4d77f9;
}

:deep(.el-button--primary) {
  background-color: #4d77f9;
  border-color: #3a5fc4;
}

:deep(.el-button--primary:hover) {
  background-color: #6c92ff;
  border-color: #4d77f9;
}

:deep(.el-button--default) {
  background-color: transparent;
  border-color: #1e3a8a;
  color: #eef2ff;
}

:deep(.el-button--default:hover) {
  background-color: #0a1a40;
  border-color: #3a5fc4;
}
</style> 