# 构建
npm run build

# 进入构建文件夹
cd dist

# 如果你要部署到自定义域名
# New-Item -Path . -Name "CNAME" -ItemType "file" -Value "www.example.com"

# 初始化git并提交
git init
git add .
git commit -m "初始提交"
git branch -M main
git remote add origin https://github.com/SYsensei/MqttDataPanel.git
git push -u origin main

# 如果你要部署在 https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:SYsensei/MqttDataPanel.git master:gh-pages

# 返回上级目录
cd ..

npm run deploy:win 