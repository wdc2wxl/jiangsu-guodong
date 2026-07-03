import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...');

  // 1. 创建用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);
  const auditorPassword = await bcrypt.hash('auditor123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      realName: '省级管理员',
      unit: '江苏省国防动员办公室',
      phone: '13800000001',
      role: 'admin',
      status: 'active',
    },
  });

  const editor = await prisma.user.upsert({
    where: { username: 'editor' },
    update: {},
    create: {
      username: 'editor',
      password: editorPassword,
      realName: '数据录入员',
      unit: '南京市国防动员办公室',
      phone: '13800000002',
      role: 'editor',
      status: 'active',
    },
  });

  const auditor = await prisma.user.upsert({
    where: { username: 'auditor' },
    update: {},
    create: {
      username: 'auditor',
      password: auditorPassword,
      realName: '审核员',
      unit: '江苏省国防动员办公室',
      phone: '13800000003',
      role: 'auditor',
      status: 'active',
    },
  });

  const cityAdmin = await prisma.user.upsert({
    where: { username: 'city_admin' },
    update: {},
    create: {
      username: 'city_admin',
      password: adminPassword,
      realName: '南京市管理员',
      unit: '南京市国防动员办公室',
      phone: '13800000004',
      role: 'city',
      status: 'active',
    },
  });

  console.log(`  ✓ 创建用户: ${admin.username}, ${editor.username}, ${auditor.username}, ${cityAdmin.username}`);

  // 2. 系统参数
  const params = [
    { category: 'map', paramName: 'default_map_app', paramValue: 'gaode', paramDesc: '默认地图应用' },
    { category: 'map', paramName: 'map_api_key', paramValue: 'your-map-key-here', paramDesc: '地图服务密钥' },
    { category: 'sms', paramName: 'sms_platform_url', paramValue: 'https://sms.api.example.com', paramDesc: '短信平台接口地址' },
    { category: 'sms', paramName: 'sms_template_login', paramValue: '您的验证码是${code}', paramDesc: '登录验证码模板' },
    { category: 'payment', paramName: 'payment_api_url', paramValue: 'https://pay.api.example.com', paramDesc: '支付平台接口地址' },
    { category: 'payment', paramName: 'merchant_id', paramValue: 'M20240001', paramDesc: '商户号' },
    { category: 'booking', paramName: 'default_advance_days', paramValue: '7', paramDesc: '默认预约提前期(天)' },
    { category: 'booking', paramName: 'default_timeout_release', paramValue: '30', paramDesc: '默认超时释放时间(分钟)' },
    { category: 'booking', paramName: 'default_max_booking', paramValue: '1', paramDesc: '默认预约上限' },
    { category: 'dictionary', paramName: 'project_types', paramValue: '["人员掩蔽工程","物资掩蔽工程","医疗救护工程","专业队工程"]', paramDesc: '人防工程类别字典' },
  ];

  for (const p of params) {
    await prisma.systemParam.create({ data: p });
  }
  console.log(`  ✓ 创建系统参数: ${params.length}条`);

  // 3. 人防工程数据
  const projects = [
    { name: '鼓楼广场人防工程', code: 'NJ-001', longitude: 118.7969, latitude: 32.0603, area: 5000, buildType: '新建', projectType: '人员掩蔽工程', capacity: 2000, peacetimeUse: '地下停车场', manageUnit: '南京市国动办', region: '南京市鼓楼区' },
    { name: '新街口地下商业街人防工程', code: 'NJ-002', longitude: 118.7782, latitude: 32.0439, area: 12000, buildType: '新建', projectType: '人员掩蔽工程', capacity: 5000, peacetimeUse: '商业街', manageUnit: '南京市国动办', region: '南京市玄武区' },
    { name: '苏州工业园人防工程', code: 'SZ-001', longitude: 120.7368, latitude: 31.3043, area: 8000, buildType: '新建', projectType: '物资掩蔽工程', capacity: 3000, peacetimeUse: '仓储', manageUnit: '苏州市国动办', region: '苏州市工业园区' },
    { name: '无锡太湖广场人防工程', code: 'WX-001', longitude: 120.3119, latitude: 31.4912, area: 6000, buildType: '改建', projectType: '人员掩蔽工程', capacity: 2500, peacetimeUse: '地下停车场', manageUnit: '无锡市国动办', region: '无锡市滨湖区' },
    { name: '徐州云龙湖人防工程', code: 'XZ-001', longitude: 117.1851, latitude: 34.2614, area: 4500, buildType: '新建', projectType: '医疗救护工程', capacity: 1500, peacetimeUse: '地下车库', manageUnit: '徐州市国动办', region: '徐州市泉山区' },
    { name: '常州文化广场人防工程', code: 'CZ-001', longitude: 119.9736, latitude: 31.7841, area: 5500, buildType: '新建', projectType: '人员掩蔽工程', capacity: 2200, peacetimeUse: '地下商业', manageUnit: '常州市国动办', region: '常州市新北区' },
  ];

  const createdProjects = [];
  for (const p of projects) {
    const proj = await prisma.civilAirDefenseProject.create({ data: p });
    createdProjects.push(proj);
  }
  console.log(`  ✓ 创建人防工程: ${createdProjects.length}条`);

  // 4. 纳凉点数据
  const coolingSpots = [
    { name: '鼓楼广场纳凉点', address: '南京市鼓楼区北京西路1号', longitude: 118.7969, latitude: 32.0603, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi"]', capacity: 200, manageUnit: '南京市国动办', contactPhone: '025-83200101', region: '南京市鼓楼区', status: 'active' },
    { name: '新街口纳凉点', address: '南京市玄武区中山路18号', longitude: 118.7782, latitude: 32.0439, openTime: '09:00-20:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi","充电"]', capacity: 300, manageUnit: '南京市国动办', contactPhone: '025-83200102', region: '南京市玄武区', status: 'active' },
    { name: '云龙湖南岸纳凉点', address: '徐州市泉山区湖东路1号', longitude: 117.1851, latitude: 34.2614, openTime: '08:00-21:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅"]', capacity: 150, manageUnit: '徐州市国动办', contactPhone: '0516-83200101', region: '徐州市泉山区', status: 'active' },
    { name: '太湖广场纳凉点', address: '无锡市滨湖区太湖大道1号', longitude: 120.3119, latitude: 31.4912, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi"]', capacity: 180, manageUnit: '无锡市国动办', contactPhone: '0510-83200101', region: '无锡市滨湖区', status: 'closed' },
  ];

  for (const c of coolingSpots) {
    await prisma.coolingSpot.create({ data: c });
  }
  console.log(`  ✓ 创建纳凉点: ${coolingSpots.length}条`);

  // 5. 便民服务点
  const servicePoints = [
    { name: '鼓楼广场便民服务点', address: '南京市鼓楼区北京西路1号', longitude: 118.7969, latitude: 32.0603, projectId: createdProjects[0].id, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '025-83200201', description: '提供便民咨询服务', region: '南京市鼓楼区', status: 'published' },
    { name: '新街口便民服务点', address: '南京市玄武区中山路18号', longitude: 118.7782, latitude: 32.0439, projectId: createdProjects[1].id, serviceType: '应急物资发放', businessHours: '08:00-18:00', contactPhone: '025-83200202', description: '应急物资发放点', region: '南京市玄武区', status: 'published' },
    { name: '工业园便民服务点', address: '苏州市工业园区现代大道1号', longitude: 120.7368, latitude: 31.3043, projectId: createdProjects[2].id, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0512-83200201', description: '便民咨询服务', region: '苏州市工业园区', status: 'published' },
  ];

  for (const s of servicePoints) {
    await prisma.convenienceServicePoint.create({ data: s });
  }
  console.log(`  ✓ 创建便民服务点: ${servicePoints.length}条`);

  // 6. 人防车位
  const parkingSpaces = [
    { projectId: createdProjects[0].id, location: '鼓楼广场B1层', totalSpaces: 100, bookableSpaces: 20, rentableSpaces: 30, priceStandard: '5元/小时', areaType: '商业区', manageUnit: '南京市国动办', contactPhone: '025-83200301', region: '南京市鼓楼区', status: 'published' },
    { projectId: createdProjects[1].id, location: '新街口B2层', totalSpaces: 200, bookableSpaces: 50, rentableSpaces: 80, priceStandard: '8元/小时', areaType: '商业区', manageUnit: '南京市国动办', contactPhone: '025-83200302', region: '南京市玄武区', status: 'published' },
    { projectId: createdProjects[2].id, location: '工业园B1层', totalSpaces: 150, bookableSpaces: 30, rentableSpaces: 40, priceStandard: '4元/小时', areaType: '工业区', manageUnit: '苏州市国动办', contactPhone: '0512-83200301', region: '苏州市工业园区', status: 'published' },
    { projectId: createdProjects[3].id, location: '太湖广场B1层', totalSpaces: 80, bookableSpaces: 15, rentableSpaces: 20, priceStandard: '5元/小时', areaType: '居民区', manageUnit: '无锡市国动办', contactPhone: '0510-83200301', region: '无锡市滨湖区', status: 'published' },
  ];

  for (const p of parkingSpaces) {
    await prisma.parkingSpace.create({ data: p });
  }
  console.log(`  ✓ 创建人防车位: ${parkingSpaces.length}条`);

  // 7. 宣教体验馆
  const museums = [
    { name: '江苏省民防宣教体验馆', address: '南京市建邺区江东中路1号', longitude: 118.7376, latitude: 32.0031, intro: '集科普教育、体验互动于一体的民防宣教基地', openTime: '周二至周日 09:00-17:00', experienceItems: '["防空警报体验","应急疏散演练","防护器材展示","VR体验"]', visitNotice: '请提前预约,参观时请保持安静', capacity: 100, bookingRule: '提前3天预约,每场限50人', contactPhone: '025-83200401', region: '南京市建邺区', status: 'published' },
    { name: '苏州市民防宣教馆', address: '苏州市姑苏区人民路1号', longitude: 120.6191, latitude: 31.2990, intro: '苏州民防宣传教育基地', openTime: '周三至周日 09:00-16:30', experienceItems: '["防空警报体验","民防知识科普"]', visitNotice: '团体参观请提前一周预约', capacity: 60, bookingRule: '提前5天预约', contactPhone: '0512-83200401', region: '苏州市姑苏区', status: 'published' },
  ];

  for (const m of museums) {
    await prisma.educationMuseum.create({ data: m });
  }
  console.log(`  ✓ 创建宣教体验馆: ${museums.length}条`);

  // 8. 警报音频
  const alarmAudios = [
    { signalType: 'pre_alarm', fileName: '预先警报.mp3', filePath: '/uploads/alarms/pre_alarm.mp3', fileSize: 2048000, duration: 180, status: 'published' },
    { signalType: 'air_raid', fileName: '空袭警报.mp3', filePath: '/uploads/alarms/air_raid.mp3', fileSize: 2048000, duration: 180, status: 'published' },
    { signalType: 'all_clear', fileName: '解除警报.mp3', filePath: '/uploads/alarms/all_clear.mp3', fileSize: 2048000, duration: 180, status: 'published' },
  ];

  for (const a of alarmAudios) {
    await prisma.alarmAudio.create({ data: a });
  }
  console.log(`  ✓ 创建警报音频: ${alarmAudios.length}条`);

  // 9. 警报信号文字说明
  const signalTexts = [
    { signalType: 'pre_alarm', rhythm: '鸣36秒,停24秒,反复3遍(3分钟)', meaning: '预先警报:表示敌方可能空袭,要求群众做好防空准备', response: '立即停止工作,携带应急物资,准备进入人防工程掩蔽', status: 'published' },
    { signalType: 'air_raid', rhythm: '鸣6秒,停6秒,反复15遍(3分钟)', meaning: '空袭警报:表示敌方即将空袭,要求群众立即进入人防工程掩蔽', response: '迅速就近进入人防工程,关闭防护门,保持安静', status: 'published' },
    { signalType: 'all_clear', rhythm: '连续鸣放3分钟', meaning: '解除警报:表示空袭威胁已解除,群众可以恢复正常活动', response: '有序离开人防工程,检查周围环境是否安全', status: 'published' },
  ];

  for (const s of signalTexts) {
    await prisma.alarmSignalText.create({ data: s });
  }
  console.log(`  ✓ 创建警报信号文字: ${signalTexts.length}条`);

  // 10. 防护知识
  const knowledge = [
    { signalType: 'pre_alarm', title: '预先警报防护指南', content: '听到预先警报后:1.立即停止工作和学习;2.关闭燃气、水源、电源;3.携带应急包(含食品、饮水、药品、手电筒等);4.通知家人和邻居;5.迅速有序进入附近人防工程。', status: 'published' },
    { signalType: 'air_raid', title: '空袭警报防护指南', content: '听到空袭警报后:1.迅速进入人防工程,不要逗留;2.进入后关闭防护门;3.保持安静,不要使用明火;4.听从管理人员指挥;5.不要擅自离开人防工程。', status: 'published' },
    { signalType: 'all_clear', title: '解除警报后注意事项', content: '听到解除警报后:1.有序离开人防工程;2.注意观察周围环境;3.远离危险区域和建筑物;4.配合救援人员工作;5.检查家中是否有损坏。', status: 'published' },
    { signalType: 'general', title: '应急物资准备清单', content: '应急包应包含:1.饮用水(每人每天3升);2.即食食品(3天量);3.急救药品;4.手电筒和电池;5.口哨;6.防护口罩;7.雨衣;8.重要证件复印件。', status: 'published' },
  ];

  for (const k of knowledge) {
    await prisma.protectionKnowledge.create({ data: k });
  }
  console.log(`  ✓ 创建防护知识: ${knowledge.length}条`);

  // 11. 审核流程
  const auditProcess = await prisma.auditProcess.create({
    data: {
      name: '人防工程数据审核流程',
      dataType: 'project',
      levels: 2,
      nodes: JSON.stringify([
        { level: 1, roleName: 'editor', timeout: 24 },
        { level: 2, roleName: 'auditor', timeout: 48 },
      ]),
      flowRule: 'sequential',
      status: 'active',
    },
  });
  console.log(`  ✓ 创建审核流程: 1条`);

  // 12. 预约规则
  await prisma.bookingRule.create({
    data: {
      ruleType: 'parking',
      name: '默认车位预约规则',
      advanceDays: 7,
      slotDuration: 60,
      timeoutRelease: 30,
      cancelLimit: 120,
      maxBooking: 1,
      targetType: 'all',
      status: 'active',
    },
  });
  console.log(`  ✓ 创建预约规则: 1条`);

  // 13. 公告
  await prisma.announcement.create({
    data: {
      title: '关于2024年度人防工程便民服务点信息采集的通知',
      content: '各设区市国动办:\n根据省国动办工作安排,现启动2024年度人防工程便民服务点信息采集工作。请各单位于7月15日前完成数据录入和审核工作。\n联系人:张三 025-83200001',
      type: 'system_notice',
      scope: 'admin',
      region: '江苏省',
      status: 'published',
      publishTime: new Date(),
      createdBy: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: '夏季纳凉点开放公告',
      content: '各位市民:\n2024年夏季纳凉点将于6月1日正式开放,开放时间为每日9:00-18:00。请前往附近的纳凉点避暑纳凉,注意保持环境卫生。',
      type: 'service_notice',
      scope: 'public',
      region: '江苏省',
      status: 'published',
      publishTime: new Date(),
      createdBy: admin.id,
    },
  });
  console.log(`  ✓ 创建公告: 2条`);

  // 14. 模拟用户访问日志 (批量插入)
  const now = new Date();
  const accessLogs: any[] = [];
  const sources = ['wechat', 'alipay', 'web'];
  const regions = ['南京市', '苏州市', '无锡市', '常州市', '徐州市'];
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const count = Math.floor(Math.random() * 200) + 50;
    for (let j = 0; j < count; j++) {
      accessLogs.push({
        userId: `user_${Math.floor(Math.random() * 10000)}`,
        source: sources[Math.floor(Math.random() * 3)],
        region: regions[Math.floor(Math.random() * 5)],
        accessTime: date,
      });
    }
  }
  await prisma.userAccessLog.createMany({ data: accessLogs });
  console.log(`  ✓ 创建用户访问日志: ${accessLogs.length}条`);

  // 15. 模拟资源查询日志 (批量插入)
  const resourceTypes = ['project', 'cooling', 'service', 'parking', 'museum'];
  const keywords = ['纳凉', '停车', '人防工程', '体验馆'];
  const queryLogs: any[] = [];
  for (let i = 0; i < 100; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    queryLogs.push({
      resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
      keyword: keywords[Math.floor(Math.random() * keywords.length)],
      queryTime: date,
    });
  }
  await prisma.resourceQueryLog.createMany({ data: queryLogs });
  console.log(`  ✓ 创建资源查询日志: ${queryLogs.length}条`);

  console.log('\n✅ 种子数据初始化完成!');
  console.log('📋 登录账号:');
  console.log('   管理员: admin / admin123');
  console.log('   录入员: editor / editor123');
  console.log('   审核员: auditor / auditor123');
  console.log('   市级管理员: city_admin / admin123');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
