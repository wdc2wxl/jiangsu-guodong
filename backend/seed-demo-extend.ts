import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始补充全量演示数据...\n');

  // 获取现有数据用于关联
  const users = await prisma.user.findMany();
  const admin = users.find(u => u.username === 'admin')!;
  const projects = await prisma.civilAirDefenseProject.findMany();
  const parkingSpaces = await prisma.parkingSpace.findMany();

  // ==================== 1. 补充纳凉点（扩展至全省13市） ====================
  const existingCooling = await prisma.coolingSpot.count();
  if (existingCooling < 15) {
    const newCooling = [
      { name: '常州文化广场纳凉点', address: '常州市新北区通江中路1号', longitude: 119.9736, latitude: 31.7841, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi","充电","电视"]', capacity: 250, manageUnit: '常州市国动办', contactPhone: '0519-83200101', region: '常州市新北区', status: 'active' },
      { name: '苏州金鸡湖纳凉点', address: '苏州市工业园区星湖街1号', longitude: 120.7368, latitude: 31.3043, openTime: '08:30-20:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi","充电"]', capacity: 350, manageUnit: '苏州市国动办', contactPhone: '0512-83200103', region: '苏州市工业园区', status: 'active' },
      { name: '南通濠河纳凉点', address: '南通市崇川区濠南路1号', longitude: 120.8738, latitude: 32.0148, openTime: '09:00-18:30', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi"]', capacity: 180, manageUnit: '南通市国动办', contactPhone: '0513-83200101', region: '南通市崇川区', status: 'active' },
      { name: '扬州文昌阁纳凉点', address: '扬州市广陵区文昌中路1号', longitude: 119.4281, latitude: 32.3948, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi","电视"]', capacity: 200, manageUnit: '扬州市国动办', contactPhone: '0514-83200101', region: '扬州市广陵区', status: 'active' },
      { name: '盐城建军路纳凉点', address: '盐城市亭湖区建军路1号', longitude: 120.1636, latitude: 33.3478, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅"]', capacity: 160, manageUnit: '盐城市国动办', contactPhone: '0515-83200101', region: '盐城市亭湖区', status: 'active' },
      { name: '镇江大市口纳凉点', address: '镇江市京口区中山东路1号', longitude: 119.4551, latitude: 32.1992, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi"]', capacity: 170, manageUnit: '镇江市国动办', contactPhone: '0511-83200101', region: '镇江市京口区', status: 'active' },
      { name: '泰州海陵纳凉点', address: '泰州市海陵区鼓楼路1号', longitude: 119.9236, latitude: 32.4564, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅"]', capacity: 150, manageUnit: '泰州市国动办', contactPhone: '0523-83200101', region: '泰州市海陵区', status: 'active' },
      { name: '淮安清江浦纳凉点', address: '淮安市清江浦区淮海路1号', longitude: 119.0209, latitude: 33.6099, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi"]', capacity: 170, manageUnit: '淮安市国动办', contactPhone: '0517-83200101', region: '淮安市清江浦区', status: 'active' },
      { name: '连云港通灌路纳凉点', address: '连云港市海州区通灌路1号', longitude: 119.2216, latitude: 34.5967, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅"]', capacity: 140, manageUnit: '连云港市国动办', contactPhone: '0518-83200101', region: '连云港市海州区', status: 'closed' },
      { name: '宿迁宿城纳凉点', address: '宿迁市宿城区洪泽湖路1号', longitude: 118.2755, latitude: 33.9629, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅"]', capacity: 130, manageUnit: '宿迁市国动办', contactPhone: '0527-83200101', region: '宿迁市宿城区', status: 'active' },
    ];
    for (const c of newCooling) {
      await prisma.coolingSpot.create({ data: c });
    }
    console.log(`  ✓ 新增纳凉点: ${newCooling.length}条`);
  }

  // ==================== 2. 补充便民服务点（扩展至全省） ====================
  const existingService = await prisma.convenienceServicePoint.count();
  if (existingService < 15) {
    const newServices = [
      { name: '太湖广场便民服务点', address: '无锡市滨湖区太湖大道1号', longitude: 120.3119, latitude: 31.4912, projectId: projects[3].id, serviceType: '应急物资发放', businessHours: '08:00-18:00', contactPhone: '0510-83200201', description: '应急物资发放点，提供饮用水、急救药品等', region: '无锡市滨湖区', status: 'published' },
      { name: '云龙湖便民服务点', address: '徐州市泉山区湖东路1号', longitude: 117.1851, latitude: 34.2614, projectId: projects[4].id, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0516-83200201', description: '便民咨询和应急物资发放', region: '徐州市泉山区', status: 'published' },
      { name: '文化广场便民服务点', address: '常州市新北区通江中路1号', longitude: 119.9736, latitude: 31.7841, projectId: projects[5].id, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0519-83200201', description: '便民咨询服务', region: '常州市新北区', status: 'published' },
      { name: '濠河便民服务点', address: '南通市崇川区濠南路1号', longitude: 120.8738, latitude: 32.0148, serviceType: '紧急避难引导', businessHours: '08:00-20:00', contactPhone: '0513-83200201', description: '紧急避难引导和物资发放', region: '南通市崇川区', status: 'published' },
      { name: '文昌阁便民服务点', address: '扬州市广陵区文昌中路1号', longitude: 119.4281, latitude: 32.3948, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0514-83200201', description: '便民咨询服务', region: '扬州市广陵区', status: 'published' },
      { name: '盐城建军路便民服务点', address: '盐城市亭湖区建军路1号', longitude: 120.1636, latitude: 33.3478, serviceType: '应急物资发放', businessHours: '08:00-18:00', contactPhone: '0515-83200201', description: '应急物资发放', region: '盐城市亭湖区', status: 'published' },
      { name: '镇江大市口便民服务点', address: '镇江市京口区中山东路1号', longitude: 119.4551, latitude: 32.1992, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0511-83200201', description: '便民咨询服务', region: '镇江市京口区', status: 'published' },
      { name: '泰州海陵便民服务点', address: '泰州市海陵区鼓楼路1号', longitude: 119.9236, latitude: 32.4564, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0523-83200201', description: '便民咨询服务', region: '泰州市海陵区', status: 'published' },
      { name: '淮安清江浦便民服务点', address: '淮安市清江浦区淮海路1号', longitude: 119.0209, latitude: 33.6099, serviceType: '紧急避难引导', businessHours: '08:00-20:00', contactPhone: '0517-83200201', description: '紧急避难引导', region: '淮安市清江浦区', status: 'published' },
      { name: '连云港海州便民服务点', address: '连云港市海州区通灌路1号', longitude: 119.2216, latitude: 34.5967, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0518-83200201', description: '便民咨询服务', region: '连云港市海州区', status: 'published' },
      { name: '宿迁宿城便民服务点', address: '宿迁市宿城区洪泽湖路1号', longitude: 118.2755, latitude: 33.9629, serviceType: '便民咨询', businessHours: '09:00-17:00', contactPhone: '0527-83200201', description: '便民咨询服务', region: '宿迁市宿城区', status: 'published' },
      { name: '南京江宁便民服务点', address: '南京市江宁区双龙大道1号', longitude: 118.8399, latitude: 31.9527, projectId: projects[0].id, serviceType: '应急物资发放', businessHours: '08:00-18:00', contactPhone: '025-83200203', description: '应急物资发放和便民咨询', region: '南京市江宁区', status: 'published' },
    ];
    for (const s of newServices) {
      await prisma.convenienceServicePoint.create({ data: s });
    }
    console.log(`  ✓ 新增便民服务点: ${newServices.length}条`);
  }

  // ==================== 3. 补充人防车位（覆盖所有工程） ====================
  const existingParking = await prisma.parkingSpace.count();
  if (existingParking < 12) {
    const newParking = [
      { projectId: projects[4].id, location: '云龙湖B1层', totalSpaces: 120, bookableSpaces: 25, rentableSpaces: 35, priceStandard: '4元/小时', areaType: '居民区', manageUnit: '徐州市国动办', contactPhone: '0516-83200301', region: '徐州市泉山区', status: 'published' },
      { projectId: projects[5].id, location: '文化广场B1-B2层', totalSpaces: 180, bookableSpaces: 40, rentableSpaces: 60, priceStandard: '6元/小时', areaType: '商业区', manageUnit: '常州市国动办', contactPhone: '0519-83200301', region: '常州市新北区', status: 'published' },
      { projectId: projects[0].id, location: '鼓楼广场B2层', totalSpaces: 80, bookableSpaces: 15, rentableSpaces: 25, priceStandard: '5元/小时', areaType: '商业区', manageUnit: '南京市国动办', contactPhone: '025-83200303', region: '南京市鼓楼区', status: 'published' },
      { projectId: projects[1].id, location: '新街口B3层', totalSpaces: 150, bookableSpaces: 35, rentableSpaces: 50, priceStandard: '8元/小时', areaType: '商业区', manageUnit: '南京市国动办', contactPhone: '025-83200304', region: '南京市玄武区', status: 'published' },
      { projectId: projects[2].id, location: '工业园B2层', totalSpaces: 100, bookableSpaces: 20, rentableSpaces: 30, priceStandard: '4元/小时', areaType: '工业区', manageUnit: '苏州市国动办', contactPhone: '0512-83200302', region: '苏州市工业园区', status: 'published' },
      { projectId: projects[3].id, location: '太湖广场B2层', totalSpaces: 60, bookableSpaces: 10, rentableSpaces: 15, priceStandard: '5元/小时', areaType: '居民区', manageUnit: '无锡市国动办', contactPhone: '0510-83200302', region: '无锡市滨湖区', status: 'published' },
      { projectId: projects[2].id, location: '工业园地面停车场', totalSpaces: 200, bookableSpaces: 50, rentableSpaces: 80, priceStandard: '3元/小时', areaType: '工业区', manageUnit: '苏州市国动办', contactPhone: '0512-83200303', region: '苏州市工业园区', status: 'published' },
      { projectId: projects[5].id, location: '文化广场地面停车场', totalSpaces: 90, bookableSpaces: 20, rentableSpaces: 30, priceStandard: '5元/小时', areaType: '商业区', manageUnit: '常州市国动办', contactPhone: '0519-83200302', region: '常州市新北区', status: 'published' },
    ];
    for (const p of newParking) {
      await prisma.parkingSpace.create({ data: p });
    }
    console.log(`  ✓ 新增人防车位: ${newParking.length}条`);
  }

  // ==================== 4. 补充宣教体验馆（扩展至全省） ====================
  const existingMuseum = await prisma.educationMuseum.count();
  if (existingMuseum < 8) {
    const newMuseums = [
      { name: '无锡市民防科普馆', address: '无锡市滨湖区太湖大道188号', longitude: 120.3119, latitude: 31.4912, intro: '无锡民防科普教育基地，集展示、体验、互动于一体', openTime: '周二至周日 09:00-17:00', experienceItems: '["防空警报体验","VR地震体验","应急疏散演练","防护器材展示"]', visitNotice: '团体参观请提前3天预约', capacity: 80, bookingRule: '提前3天预约,每场限40人', contactPhone: '0510-83200401', region: '无锡市滨湖区', status: 'published' },
      { name: '徐州市民防宣教中心', address: '徐州市泉山区湖东路68号', longitude: 117.1851, latitude: 34.2614, intro: '徐州民防宣传教育基地', openTime: '周三至周日 09:00-16:30', experienceItems: '["防空警报体验","民防知识科普","急救技能培训"]', visitNotice: '团体参观请提前一周预约', capacity: 60, bookingRule: '提前5天预约', contactPhone: '0516-83200401', region: '徐州市泉山区', status: 'published' },
      { name: '常州市民防体验馆', address: '常州市新北区通江中路88号', longitude: 119.9736, latitude: 31.7841, intro: '常州民防体验教育基地', openTime: '周二至周日 09:00-17:00', experienceItems: '["防空警报体验","VR逃生演练","应急疏散演练"]', visitNotice: '请提前预约,参观时请遵守秩序', capacity: 70, bookingRule: '提前3天预约', contactPhone: '0519-83200401', region: '常州市新北区', status: 'published' },
      { name: '南通市民防科普体验馆', address: '南通市崇川区濠南路168号', longitude: 120.8738, latitude: 32.0148, intro: '南通民防科普教育基地', openTime: '周三至周日 09:00-17:00', experienceItems: '["防空警报体验","民防知识科普","防护器材展示"]', visitNotice: '团体参观请提前3天预约', capacity: 50, bookingRule: '提前3天预约', contactPhone: '0513-83200401', region: '南通市崇川区', status: 'published' },
      { name: '扬州市民防宣教馆', address: '扬州市广陵区文昌中路188号', longitude: 119.4281, latitude: 32.3948, intro: '扬州民防宣传教育基地', openTime: '周二至周日 09:00-17:00', experienceItems: '["防空警报体验","VR体验","应急疏散演练"]', visitNotice: '团体参观请提前一周预约', capacity: 55, bookingRule: '提前5天预约', contactPhone: '0514-83200401', region: '扬州市广陵区', status: 'published' },
      { name: '盐城市民防体验中心', address: '盐城市亭湖区建军路88号', longitude: 120.1636, latitude: 33.3478, intro: '盐城民防体验教育基地', openTime: '周三至周日 09:00-16:30', experienceItems: '["防空警报体验","民防知识科普"]', visitNotice: '请提前预约', capacity: 45, bookingRule: '提前3天预约', contactPhone: '0515-83200401', region: '盐城市亭湖区', status: 'published' },
    ];
    for (const m of newMuseums) {
      await prisma.educationMuseum.create({ data: m });
    }
    console.log(`  ✓ 新增宣教体验馆: ${newMuseums.length}条`);
  }

  // ==================== 5. 补充防护知识 ====================
  const existingKnowledge = await prisma.protectionKnowledge.count();
  if (existingKnowledge < 12) {
    const newKnowledge = [
      { title: '核生化防护基本知识', content: '核生化防护基本知识:1.核武器防护:进入人防工程掩蔽,远离窗户和外墙;2.化学武器防护:佩戴防毒面具,用湿毛巾捂住口鼻;3.生物武器防护:接种疫苗,保持个人卫生,避免接触可疑物品。', signalType: 'general', status: 'published' },
      { title: '地震应急避险指南', content: '地震应急避险:1.就近躲避在坚固家具旁或墙角;2.保护头部,远离玻璃窗和吊灯;3.地震停止后迅速撤离到空旷地带;4.不要乘坐电梯;5.如在室外,远离建筑物和电线杆。', signalType: 'general', status: 'published' },
      { title: '火灾逃生自救方法', content: '火灾逃生自救:1.保持冷静,判断火势方向;2.用湿毛巾捂住口鼻,低姿前行;3.不要乘坐电梯,走安全通道;4.如被困,在窗口挥动鲜艳衣物求救;5.身上着火,就地打滚或用水浇灭。', signalType: 'general', status: 'published' },
      { title: '洪涝灾害防范知识', content: '洪涝灾害防范:1.关注天气预报和预警信息;2.提前准备应急物资和救生设备;3.洪水来临时向高处转移;4.不要涉水行走,避免触电;5.被困时拨打119求救,节约手机电量。', signalType: 'general', status: 'published' },
      { title: '台风天气防护措施', content: '台风天气防护:1.加固门窗,收起阳台物品;2.不要外出,远离广告牌和临时搭建物;3.车辆停放在安全位置,避免停在大树下;4.准备应急照明和食品;5.关注官方发布的最新预警信息。', signalType: 'general', status: 'published' },
      { title: '急救止血包扎技术', content: '急救止血包扎:1.直接压迫止血:用干净纱布直接按压伤口;2.止血带止血:在伤口近心端绑扎,每30分钟松开1-2分钟;3.包扎固定:用绷带包扎,松紧适度;4.抬高伤肢:将受伤部位抬高,减少出血;5.及时就医。', signalType: 'general', status: 'published' },
      { title: '心肺复苏操作指南', content: '心肺复苏(CPR)操作:1.确认现场安全,判断患者意识;2.呼叫120;3.胸外按压:双手交叉,按压胸骨中下段,深度5-6cm,频率100-120次/分;4.开放气道,人工呼吸:按压30次后吹气2次;5.持续进行直到专业救护人员到达。', signalType: 'general', status: 'published' },
      { title: '化学事故应急防护', content: '化学事故应急防护:1.迅速判断风向,向上风向撤离;2.用湿毛巾或口罩捂住口鼻;3.关闭门窗,封堵缝隙;4.不要饮用可能被污染的水源;5.听从专业人员指挥,配合疏散。', signalType: 'general', status: 'published' },
    ];
    for (const k of newKnowledge) {
      await prisma.protectionKnowledge.create({ data: k });
    }
    console.log(`  ✓ 新增防护知识: ${newKnowledge.length}条`);
  }

  // ==================== 6. 补充审核流程 ====================
  const existingProcess = await prisma.auditProcess.count();
  if (existingProcess < 5) {
    const newProcesses = [
      { name: '纳凉点数据审核流程', dataType: 'cooling', levels: 2, nodes: JSON.stringify([{ level: 1, roleName: 'editor', timeout: 24 }, { level: 2, roleName: 'auditor', timeout: 48 }]), flowRule: 'sequential', status: 'active' },
      { name: '便民服务点审核流程', dataType: 'service', levels: 2, nodes: JSON.stringify([{ level: 1, roleName: 'editor', timeout: 24 }, { level: 2, roleName: 'auditor', timeout: 48 }]), flowRule: 'sequential', status: 'active' },
      { name: '人防车位审核流程', dataType: 'parking', levels: 2, nodes: JSON.stringify([{ level: 1, roleName: 'editor', timeout: 24 }, { level: 2, roleName: 'auditor', timeout: 48 }]), flowRule: 'sequential', status: 'active' },
      { name: '宣教体验馆审核流程', dataType: 'museum', levels: 2, nodes: JSON.stringify([{ level: 1, roleName: 'editor', timeout: 24 }, { level: 2, roleName: 'auditor', timeout: 48 }]), flowRule: 'sequential', status: 'inactive' },
    ];
    for (const p of newProcesses) {
      await prisma.auditProcess.create({ data: p });
    }
    console.log(`  ✓ 新增审核流程: ${newProcesses.length}条`);
  }

  // ==================== 7. 补充预约规则 ====================
  const existingRule = await prisma.bookingRule.count();
  if (existingRule < 3) {
    const newRules = [
      { ruleType: 'museum', name: '博物馆默认预约规则', advanceDays: 7, slotDuration: 120, timeoutRelease: 30, cancelLimit: 1440, maxBooking: 2, targetType: 'all', status: 'active' },
      { ruleType: 'parking', name: '周末车位预约规则', advanceDays: 3, slotDuration: 120, timeoutRelease: 15, cancelLimit: 60, maxBooking: 2, targetType: 'parking', status: 'active' },
      { ruleType: 'museum', name: '团体参观预约规则', advanceDays: 14, slotDuration: 180, timeoutRelease: 60, cancelLimit: 2880, maxBooking: 5, targetType: 'museum', status: 'active' },
    ];
    for (const r of newRules) {
      await prisma.bookingRule.create({ data: r });
    }
    console.log(`  ✓ 新增预约规则: ${newRules.length}条`);
  }

  // ==================== 8. 补充公告 ====================
  const existingAnnouncement = await prisma.announcement.count();
  if (existingAnnouncement < 10) {
    const newAnnouncements = [
      { title: '关于人防工程安全排查工作的通知', content: '各设区市国动办:\n根据上级要求，请各单位于本月内完成人防工程安全排查，重点检查消防设施、通风系统和防护门运行情况。排查结果请于月底前上报省办。', type: 'system_notice', scope: 'admin', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '便民服务点新增服务项目公告', content: '各位市民:\n为进一步提升便民服务水平，全省各便民服务点新增充电宝租借、应急药品领取等便民服务项目。欢迎广大市民前往体验。', type: 'service_notice', scope: 'public', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '人防车位预约规则调整通知', content: '各位车主:\n自2024年8月1日起，人防车位预约规则调整如下：1.预约提前期从7天调整为14天；2.取消时限从2小时调整为4小时；3.每人每日最多预约2次。请广大车主知悉。', type: 'service_notice', scope: 'public', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '关于做好国防教育宣传工作的通知', content: '各设区市国动办:\n根据省委宣传部统一部署，请各单位充分利用宣教体验馆、纳凉点等阵地，开展形式多样的国防教育宣传活动。活动方案请于7月20日前报省办备案。', type: 'policy_publicity', scope: 'admin', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '南京市纳凉点增设公告', content: '南京市各位市民:\n为应对高温天气，南京市新增3个纳凉点：江宁区双龙大道纳凉点、栖霞区仙林纳凉点、浦口区江浦纳凉点。开放时间：每日9:00-18:00。', type: 'service_notice', scope: 'public', region: '南京市', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '2024年度人防工程数据采集工作启动', content: '各设区市国动办:\n2024年度人防工程数据采集工作正式启动。请各单位于8月31日前完成数据录入，9月15日前完成审核。数据采集标准详见附件。', type: 'system_notice', scope: 'admin', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '《江苏省人防工程管理条例》修订征求意见', content: '各相关单位:\n根据省人大常委会立法计划，《江苏省人防工程管理条例》修订草案已形成，现面向社会公开征求意见。意见反馈截止日期：2024年9月30日。', type: 'policy_publicity', scope: 'public', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
      { title: '宣教体验馆暑期开放时间调整通知', content: '各位市民:\n为满足暑期参观需求，全省宣教体验馆自7月1日至8月31日延长开放时间，调整为周二至周日 09:00-18:00。欢迎广大市民前来参观体验。', type: 'service_notice', scope: 'public', region: '江苏省', status: 'published', publishTime: new Date(), createdBy: admin.id },
    ];
    for (const a of newAnnouncements) {
      await prisma.announcement.create({ data: a });
    }
    console.log(`  ✓ 新增公告: ${newAnnouncements.length}条`);
  }

  // ==================== 9. 补充操作日志 ====================
  const existingLog = await prisma.operationLog.count();
  if (existingLog < 200) {
    const modules = ['人防工程', '纳凉点', '便民服务点', '人防车位', '宣教体验馆', '警报管理', '用户管理', '公告管理', '系统参数', '车位预约', '车位租赁', '预约规则', '审核流程'];
    const actions = ['create', 'update', 'delete', 'audit_pass', 'audit_reject', 'login', 'export'];
    const targets = ['鼓楼广场人防工程', '新街口纳凉点', '便民服务点', '车位预约', '防护知识', '系统参数', '用户信息', '审核流程', '太湖广场车位', '工业园地面停车场'];
    const logEntries: any[] = [];
    const now = new Date();
    for (let i = 0; i < 200; i++) {
      const date = new Date(now);
      date.setHours(date.getHours() - Math.floor(Math.random() * 720));
      logEntries.push({
        userId: users[Math.floor(Math.random() * users.length)].id,
        module: modules[Math.floor(Math.random() * modules.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        target: targets[Math.floor(Math.random() * targets.length)],
        detail: JSON.stringify({ ip: '192.168.1.' + Math.floor(Math.random() * 255) }),
        result: Math.random() > 0.05 ? 'success' : 'fail',
        createdAt: date,
      });
    }
    await prisma.operationLog.createMany({ data: logEntries });
    console.log(`  ✓ 新增操作日志: ${logEntries.length}条`);
  }

  // ==================== 10. 补充报表模板 ====================
  const existingTemplate = await prisma.reportTemplate.count();
  if (existingTemplate < 8) {
    const newTemplates = [
      { name: '人防工程月度统计报表', type: 'project', metrics: JSON.stringify(['total', 'byRegion', 'byType', 'byStatus']), format: 'pdf', status: 'active' },
      { name: '纳凉点运营统计报表', type: 'cooling', metrics: JSON.stringify(['total', 'byRegion', 'visitorCount', 'satisfaction']), format: 'pdf', status: 'active' },
      { name: '车位预约使用统计报表', type: 'booking', metrics: JSON.stringify(['total', 'usageRate', 'cancelRate', 'peakHours']), format: 'pdf', status: 'active' },
      { name: '车位租赁收入统计报表', type: 'rental', metrics: JSON.stringify(['total', 'revenue', 'byRegion', 'byMonth']), format: 'pdf', status: 'active' },
      { name: '宣教体验馆参观统计', type: 'museum', metrics: JSON.stringify(['total', 'visitorCount', 'satisfaction', 'byMonth']), format: 'pdf', status: 'active' },
      { name: '用户活跃度分析报表', type: 'user', metrics: JSON.stringify(['dau', 'mau', 'bySource', 'byRegion']), format: 'excel', status: 'active' },
      { name: '数据质量审核月报', type: 'audit', metrics: JSON.stringify(['total', 'passRate', 'avgTime', 'byType']), format: 'pdf', status: 'active' },
      { name: '便民服务点运营概览', type: 'service', metrics: JSON.stringify(['total', 'byRegion', 'serviceCount', 'rating']), format: 'pdf', status: 'inactive' },
    ];
    for (const t of newTemplates) {
      await prisma.reportTemplate.create({ data: t });
    }
    console.log(`  ✓ 新增报表模板: ${newTemplates.length}条`);
  }

  // ==================== 11. 补充报表记录 ====================
  const existingRecord = await prisma.reportRecord.count();
  if (existingRecord < 20) {
    const templates = await prisma.reportTemplate.findMany();
    const reportRecords: any[] = [];
    const now2 = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(now2);
      date.setDate(date.getDate() - i * 30);
      reportRecords.push({
        templateId: templates[Math.floor(Math.random() * templates.length)].id,
        name: `报表_${date.getFullYear()}_${date.getMonth() + 1}`,
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        filePath: `/reports/report_${date.getFullYear()}${date.getMonth() + 1}.pdf`,
        format: 'pdf',
        createdBy: admin.id,
        createdAt: date,
      });
    }
    for (const r of reportRecords) {
      await prisma.reportRecord.create({ data: r });
    }
    console.log(`  ✓ 新增报表记录: ${reportRecords.length}条`);
  }

  // ==================== 12. 补充系统参数 ====================
  const existingParam = await prisma.systemParam.count();
  if (existingParam < 25) {
    const newParams = [
      { category: 'dictionary', paramName: 'service_types', paramValue: '["便民咨询","应急物资发放","紧急避难引导","充电服务","饮水服务"]', paramDesc: '便民服务类型字典' },
      { category: 'dictionary', paramName: 'build_types', paramValue: '["新建","改建","扩建","加固"]', paramDesc: '建设类型字典' },
      { category: 'dictionary', paramName: 'alert_signal_types', paramValue: '["pre_alarm","air_raid","all_clear"]', paramDesc: '警报信号类型' },
      { category: 'dictionary', paramName: 'cooling_facilities', paramValue: '["空调","饮水机","座椅","WiFi","充电","电视","急救箱"]', paramDesc: '纳凉点设施字典' },
      { category: 'dictionary', paramName: 'area_types', paramValue: '["商业区","居民区","工业区","办公区","教育区"]', paramDesc: '重点区域类型' },
      { category: 'booking', paramName: 'booking_start_hour', paramValue: '8', paramDesc: '预约开始时间(小时)' },
      { category: 'booking', paramName: 'booking_end_hour', paramValue: '20', paramDesc: '预约结束时间(小时)' },
      { category: 'system', paramName: 'system_version', paramValue: '2.1.0', paramDesc: '系统版本号' },
      { category: 'system', paramName: 'maintenance_mode', paramValue: 'false', paramDesc: '维护模式开关' },
      { category: 'system', paramName: 'max_upload_size', paramValue: '50', paramDesc: '最大上传文件大小(MB)' },
    ];
    for (const p of newParams) {
      await prisma.systemParam.create({ data: p });
    }
    console.log(`  ✓ 新增系统参数: ${newParams.length}条`);
  }

  // ==================== 13. 补充用户访问日志（最近30天） ====================
  const existingAccessLog = await prisma.userAccessLog.count();
  if (existingAccessLog < 8000) {
    const sources = ['wechat', 'alipay', 'web'];
    const regions = ['南京市', '苏州市', '无锡市', '常州市', '徐州市', '南通市', '扬州市', '盐城市', '镇江市', '泰州市', '淮安市', '连云港市', '宿迁市'];
    const accessLogs: any[] = [];
    const now3 = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now3);
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 150) + 80;
      for (let j = 0; j < count; j++) {
        accessLogs.push({
          userId: `user_${Math.floor(Math.random() * 20000)}`,
          source: sources[Math.floor(Math.random() * 3)],
          region: regions[Math.floor(Math.random() * regions.length)],
          accessTime: new Date(date.getTime() + Math.random() * 86400000),
        });
      }
    }
    await prisma.userAccessLog.createMany({ data: accessLogs });
    console.log(`  ✓ 新增访问日志: ${accessLogs.length}条`);
  }

  // ==================== 14. 补充资源查询日志 ====================
  const existingQueryLog = await prisma.resourceQueryLog.count();
  if (existingQueryLog < 500) {
    const resourceTypes = ['project', 'cooling', 'service', 'parking', 'museum'];
    const keywords = ['纳凉', '停车', '人防工程', '体验馆', '便民', '警报', '防护', '预约', '租赁', '车位'];
    const queryLogs: any[] = [];
    const now4 = new Date();
    for (let i = 0; i < 300; i++) {
      const date = new Date(now4);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      queryLogs.push({
        resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        resourceId: Math.floor(Math.random() * 20) + 1,
        keyword: keywords[Math.floor(Math.random() * keywords.length)],
        queryTime: new Date(date.getTime() + Math.random() * 86400000),
      });
    }
    await prisma.resourceQueryLog.createMany({ data: queryLogs });
    console.log(`  ✓ 新增资源查询日志: ${queryLogs.length}条`);
  }

  // ==================== 15. 补充车位预约记录 ====================
  const existingReservation = await prisma.parkingReservation.count();
  if (existingReservation < 30) {
    const allParking = await prisma.parkingSpace.findMany();
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑华', '陈亮', '刘洋', '杨帆', '黄磊', '许明', '林峰', '何静', '宋雨', '唐林', '曹阳', '谢芳'];
    const phones = ['139', '138', '137', '136', '135', '158', '159', '186', '187', '188'];
    const plates = ['苏A', '苏B', '苏C', '苏D', '苏E', '苏F', '苏G', '苏H', '苏J', '苏K'];
    const statuses = ['reserved', 'used', 'expired', 'cancelled', 'reserved', 'reserved', 'used', 'reserved', 'reserved', 'used'];
    const reservationEntries: any[] = [];
    const now5 = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now5);
      date.setDate(date.getDate() - Math.floor(Math.random() * 14));
      const parking = allParking[Math.floor(Math.random() * allParking.length)];
      const startH = 8 + Math.floor(Math.random() * 12);
      reservationEntries.push({
        reservationNo: `RES${String(now5.getFullYear()).slice(2)}${String(now5.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
        parkingId: parking.id,
        projectId: parking.projectId,
        userName: names[Math.floor(Math.random() * names.length)],
        userPhone: phones[Math.floor(Math.random() * phones.length)] + String(Math.floor(Math.random() * 90000000) + 10000000),
        plateNumber: plates[Math.floor(Math.random() * plates.length)] + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String(Math.floor(Math.random() * 900) + 100),
        reserveDate: date,
        startTime: `${startH}:00`,
        endTime: `${startH + 2}:00`,
        status: statuses[i % statuses.length],
        submitTime: new Date(date.getTime() - Math.random() * 86400000),
      });
    }
    for (const r of reservationEntries) {
      await prisma.parkingReservation.create({ data: r });
    }
    console.log(`  ✓ 新增车位预约: ${reservationEntries.length}条`);
  }

  // ==================== 16. 补充车位租赁记录 ====================
  const existingRental = await prisma.parkingRental.count();
  if (existingRental < 20) {
    const allParking = await prisma.parkingSpace.findMany();
    const names = ['张伟', '李娜', '王强', '赵敏', '钱磊', '孙丽', '周杰', '吴芳', '郑刚', '陈梅', '刘志', '杨雪', '黄勇', '许婷', '林涛', '何鑫', '宋佳', '唐锐', '曹峰', '谢冰'];
    const phones = ['139', '138', '137', '136', '135', '158', '159', '186', '187', '188'];
    const rentalStatuses = ['active', 'active', 'active', 'active', 'approved', 'approved', 'active', 'active', 'expired', 'terminated', 'active', 'active', 'approved', 'active', 'active', 'expired', 'active', 'active', 'active', 'approved'];
    const rentalEntries: any[] = [];
    const now6 = new Date();
    for (let i = 0; i < 20; i++) {
      const parking = allParking[Math.floor(Math.random() * allParking.length)];
      const startDate = new Date(now6);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 180));
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6 + Math.floor(Math.random() * 12));
      rentalEntries.push({
        rentalNo: `RNT${String(now6.getFullYear()).slice(2)}${String(now6.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
        parkingId: parking.id,
        projectId: parking.projectId,
        applicantName: names[i],
        applicantPhone: phones[Math.floor(Math.random() * phones.length)] + String(Math.floor(Math.random() * 90000000) + 10000000),
        idCard: `320${String(Math.floor(Math.random() * 9) + 1)}${String(now6.getFullYear() - 30 - Math.floor(Math.random() * 20)).slice(2)}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 9000) + 1000)}`,
        leasePrice: [300, 400, 500, 600, 800][Math.floor(Math.random() * 5)],
        leasePeriod: `${6 + Math.floor(Math.random() * 12)}个月`,
        leaseConditions: '遵守停车场管理规定,按时缴纳租金,不得转租',
        startDate: startDate,
        endDate: endDate,
        status: rentalStatuses[i],
        submitTime: new Date(startDate.getTime() - 7 * 86400000),
      });
    }
    for (const r of rentalEntries) {
      await prisma.parkingRental.create({ data: r });
    }
    console.log(`  ✓ 新增车位租赁: ${rentalEntries.length}条`);
  }

  // ==================== 17. 补充审核任务和审核记录 ====================
  const existingTask = await prisma.auditTask.count();
  if (existingTask < 15) {
    const processes = await prisma.auditProcess.findMany({ where: { status: 'active' } });
    const editor = users.find(u => u.role === 'editor')!;
    const auditor = users.find(u => u.role === 'auditor')!;
    const dataTypes = ['project', 'cooling', 'service', 'parking', 'museum'];
    const dataNames: Record<string, string[]> = {
      project: ['鼓楼广场人防工程', '新街口人防工程', '苏州工业园人防工程', '无锡太湖广场人防工程'],
      cooling: ['常州文化广场纳凉点', '苏州金鸡湖纳凉点', '南通濠河纳凉点', '扬州文昌阁纳凉点'],
      service: ['太湖广场便民服务点', '云龙湖便民服务点', '文化广场便民服务点', '濠河便民服务点'],
      parking: ['鼓楼广场B2车位', '新街口B3车位', '工业园B2车位', '太湖广场B2车位'],
      museum: ['无锡市民防科普馆', '徐州市民防宣教中心', '常州市民防体验馆', '南通市民防科普体验馆'],
    };
    const statuses = ['pending', 'pending', 'pending', 'approved', 'approved', 'approved', 'approved', 'approved', 'approved', 'rejected', 'rejected', 'pending', 'approved', 'approved', 'approved'];
    const now7 = new Date();
    const taskEntries: any[] = [];
    const recordEntries: any[] = [];
    for (let i = 0; i < 15; i++) {
      const dt = dataTypes[i % dataTypes.length];
      const namesList = dataNames[dt];
      const process = processes.find(p => p.dataType === dt) || processes[0];
      const date = new Date(now7);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const status = statuses[i];
      taskEntries.push({
        processId: process.id,
        dataType: dt,
        dataId: i + 1,
        dataSummary: namesList[i % namesList.length],
        submitterId: editor.id,
        currentNode: 1,
        status: status,
        submitTime: date,
        completeTime: status !== 'pending' ? new Date(date.getTime() + 86400000 * (1 + Math.floor(Math.random() * 3))) : null,
      });
    }
    // 先创建任务
    for (const t of taskEntries) {
      await prisma.auditTask.create({ data: t });
    }
    console.log(`  ✓ 新增审核任务: ${taskEntries.length}条`);

    // 为已完成的任务创建审核记录
    const allTasks = await prisma.auditTask.findMany();
    const opinions = ['审核通过,数据完整准确', '经核实,数据符合要求,予以通过', '数据质量良好,审核通过', '信息填写不完整,请补充后重新提交', '数据存在错误,请核实后重新提交', '提交材料不符合要求,予以驳回'];
    const actions = ['pass', 'pass', 'pass', 'pass', 'return', 'reject'];
    for (const task of allTasks) {
      if (task.status !== 'pending') {
        const opinionIdx = Math.floor(Math.random() * opinions.length);
        recordEntries.push({
          taskId: task.id,
          auditorId: auditor.id,
          node: 1,
          action: actions[opinionIdx],
          opinion: opinions[opinionIdx],
          createdAt: task.completeTime || new Date(),
        });
      }
    }
    for (const r of recordEntries) {
      await prisma.auditRecord.create({ data: r });
    }
    console.log(`  ✓ 新增审核记录: ${recordEntries.length}条`);
  }

  console.log('\n✅ 全量演示数据补充完成!');
  await prisma.$disconnect();
}

main().catch((e) => { console.error('❌ 失败:', e); process.exit(1); });