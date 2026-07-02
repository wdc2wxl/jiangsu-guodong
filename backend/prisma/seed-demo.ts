import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始补充演示数据...');

  const now = new Date();

  // 获取已有数据
  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  const editor = await prisma.user.findFirst({ where: { username: 'editor' } });
  const auditor = await prisma.user.findFirst({ where: { username: 'auditor' } });
  if (!admin || !editor || !auditor) {
    console.log('请先运行主种子脚本');
    return;
  }

  const parkingSpaces = await prisma.parkingSpace.findMany();
  const projects = await prisma.civilAirDefenseProject.findMany();

  // ============ 1. 车位预约记录 ============
  console.log('  创建车位预约记录...');
  const reservationStatuses = ['reserved', 'used', 'expired', 'cancelled'];
  const names = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨明', '赵磊', '黄丽', '周强', '吴敏', '徐军', '孙慧', '马超', '朱琳', '胡兵', '郭红', '何勇', '林雪', '高峰', '罗丹'];
  const plates = ['苏A12345', '苏A67890', '苏B22222', '苏A55555', '苏C33333', '苏A88888', '苏B99999', '苏A45678', '苏D66666', '苏E77777'];
  
  const reservations: any[] = [];
  for (let i = 0; i < 40; i++) {
    const parking = parkingSpaces[i % parkingSpaces.length];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(8 + Math.floor(Math.random() * 10));
    const status = reservationStatuses[Math.floor(Math.random() * reservationStatuses.length)];
    reservations.push({
      reservationNo: `YY${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(i+1).padStart(4,'0')}`,
      parkingId: parking.id,
      projectId: parking.projectId,
      userName: names[i % names.length],
      userPhone: `138${String(Math.floor(10000000 + Math.random() * 89999999))}`,
      plateNumber: plates[i % plates.length],
      reserveDate: date,
      startTime: '09:00',
      endTime: '18:00',
      status,
      submitTime: date,
      arriveTime: status === 'used' ? new Date(date.getTime() + 30*60000) : null,
      leaveTime: status === 'used' ? new Date(date.getTime() + 8*3600000) : null,
    });
  }
  await prisma.parkingReservation.createMany({ data: reservations });
  console.log(`  ✓ 创建车位预约记录: ${reservations.length}条`);

  // ============ 2. 车位租赁记录 ============
  console.log('  创建车位租赁记录...');
  const rentalStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'active', 'expired'];
  const rentalData: any[] = [];
  for (let i = 0; i < 25; i++) {
    const parking = parkingSpaces[i % parkingSpaces.length];
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const status = rentalStatuses[Math.floor(Math.random() * rentalStatuses.length)];
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() + Math.floor(Math.random() * 6) - 2);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);
    rentalData.push({
      rentalNo: `ZL${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(i+1).padStart(4,'0')}`,
      parkingId: parking.id,
      projectId: parking.projectId,
      applicantName: names[i % names.length],
      applicantPhone: `139${String(Math.floor(10000000 + Math.random() * 89999999))}`,
      idCard: `3201${String(Math.floor(10000000 + Math.random() * 89999999))}`,
      leasePrice: [200, 300, 350, 400, 500][Math.floor(Math.random() * 5)],
      leasePeriod: ['1年', '2年', '6个月', '3年'][Math.floor(Math.random() * 4)],
      leaseConditions: '符合租赁条件，资料齐全',
      startDate: status === 'active' || status === 'expired' ? startDate : null,
      endDate: status === 'active' || status === 'expired' ? endDate : null,
      status,
      submitTime: date,
    });
  }
  await prisma.parkingRental.createMany({ data: rentalData });
  console.log(`  ✓ 创建车位租赁记录: ${rentalData.length}条`);

  // ============ 3. 审核任务 ============
  console.log('  创建审核任务...');
  const auditProcess = await prisma.auditProcess.findFirst({ where: { status: 'active' } });
  if (auditProcess) {
    const dataTypes = ['project', 'cooling', 'service', 'parking', 'museum'];
    const taskStatuses = ['pending', 'approved', 'rejected', 'returned'];
    const auditTasks: any[] = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 20));
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      const dataType = dataTypes[i % dataTypes.length];
      auditTasks.push({
        processId: auditProcess.id,
        dataType,
        dataId: (i % 6) + 1,
        dataSummary: `${dataType === 'project' ? '人防工程' : dataType === 'cooling' ? '纳凉点' : dataType === 'service' ? '便民服务点' : dataType === 'parking' ? '人防车位' : '宣教体验馆'}数据#${i+1}`,
        submitterId: editor.id,
        currentNode: status === 'pending' ? 1 : 2,
        status,
        submitTime: date,
        completeTime: status !== 'pending' ? new Date(date.getTime() + 24*3600000) : null,
      });
    }
    await prisma.auditTask.createMany({ data: auditTasks });
    console.log(`  ✓ 创建审核任务: ${auditTasks.length}条`);

    // 审核记录
    const auditRecords: any[] = [];
    for (let i = 1; i <= 12; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 15));
      const actions = ['pass', 'return', 'reject'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      auditRecords.push({
        taskId: i,
        auditorId: auditor.id,
        node: 1,
        action,
        opinion: action === 'pass' ? '数据核实无误，审核通过' : action === 'return' ? '信息不完整，退回修改' : '数据错误，驳回',
        createdAt: date,
      });
    }
    await prisma.auditRecord.createMany({ data: auditRecords });
    console.log(`  ✓ 创建审核记录: ${auditRecords.length}条`);
  }

  // ============ 4. 操作日志 ============
  console.log('  创建操作日志...');
  const logModules = ['数据管理', '数据审核', '预约租赁', '统计分析', '系统管理'];
  const logActions = ['create', 'update', 'delete', 'audit_pass', 'audit_reject', 'login', 'export'];
  const logTargets = ['人防工程', '纳凉点', '便民服务点', '人防车位', '宣教体验馆', '警报音频', '审核流程', '车位预约', '车位租赁', '系统用户', '系统参数', '公告'];
  const users = [admin, editor, auditor];
  const logData: any[] = [];
  for (let i = 0; i < 50; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(8 + Math.floor(Math.random() * 12));
    const user = users[i % users.length];
    logData.push({
      userId: user.id,
      module: logModules[i % logModules.length],
      action: logActions[Math.floor(Math.random() * logActions.length)],
      target: logTargets[i % logTargets.length],
      detail: `操作详情记录#${i+1}`,
      ip: `10.10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      result: Math.random() > 0.1 ? 'success' : 'fail',
      createdAt: date,
    });
  }
  await prisma.operationLog.createMany({ data: logData });
  console.log(`  ✓ 创建操作日志: ${logData.length}条`);

  // ============ 5. 更多公告 ============
  console.log('  创建更多公告...');
  const announcements = [
    { title: '关于开展2024年防空警报试鸣工作的通知', content: '根据《中华人民共和国人民防空法》规定，定于2024年9月18日上午10:00至10:15在全省范围内统一试鸣防空警报。\n试鸣信号顺序：预先警报(3分钟)、空袭警报(3分钟)、解除警报(3分钟)。\n请各单位做好宣传和解释工作，避免引起市民恐慌。', type: 'system_notice', scope: 'public', region: '江苏省', status: 'published', publishTime: now, createdBy: admin.id },
    { title: '人防工程安全检查通知', content: '各市国动办:\n根据年度工作安排，省办将于7月1日至7月15日对全省人防工程进行安全检查。请各单位提前做好自查工作，重点检查工程结构安全、消防设施、通风系统等。', type: 'system_notice', scope: 'admin', region: '江苏省', status: 'published', publishTime: now, createdBy: admin.id },
    { title: '便民服务点优化升级公告', content: '为更好地服务市民，我省便民服务点已完成优化升级，新增在线咨询、预约导航等功能，欢迎市民使用。', type: 'service_notice', scope: 'public', region: '江苏省', status: 'published', publishTime: now, createdBy: admin.id },
    { title: '关于人防车位租赁政策调整的说明', content: '根据最新政策要求，人防车位租赁价格将进行适当调整，新标准自2024年8月1日起执行。具体标准请咨询各车位管理单位。', type: 'policy_publicity', scope: 'public', region: '江苏省', status: 'published', publishTime: now, createdBy: admin.id },
    { title: '年度人防宣传教育活动安排', content: '2024年度人防宣传教育活动安排如下：\n1. 7月: 人防知识进社区\n2. 8月: 防空防灾演练周\n3. 9月: 防空警报试鸣日\n4. 10月: 人防工程开放日\n请各单位按要求组织实施。', type: 'system_notice', scope: 'admin', region: '江苏省', status: 'published', publishTime: now, createdBy: admin.id },
  ];
  for (const a of announcements) {
    await prisma.announcement.create({ data: a });
  }
  console.log(`  ✓ 创建公告: ${announcements.length}条`);

  // ============ 6. 更多系统参数 ============
  console.log('  创建更多系统参数...');
  const extraParams = [
    { category: 'dictionary', paramName: 'build_types', paramValue: '["掘开式","坑道式","地道式","附建式"]', paramDesc: '建设类型字典' },
    { category: 'dictionary', paramName: 'alarm_types', paramValue: '["预先警报","空袭警报","解除警报","灾情警报"]', paramDesc: '警报类型字典' },
    { category: 'dictionary', paramName: 'service_types', paramValue: '["便民咨询","应急物资发放","宣传教育","志愿服务"]', paramDesc: '便民服务类型字典' },
    { category: 'dictionary', paramName: 'user_roles', paramValue: '["admin","province","city","district","editor","auditor","viewer"]', paramDesc: '用户角色字典' },
    { category: 'map', paramName: 'map_center_lng', paramValue: '118.7969', paramDesc: '地图默认中心经度(南京)' },
    { category: 'map', paramName: 'map_center_lat', paramValue: '32.0603', paramDesc: '地图默认中心纬度(南京)' },
    { category: 'map', paramName: 'map_zoom', paramValue: '12', paramDesc: '地图默认缩放级别' },
    { category: 'booking', paramName: 'max_rental_period', paramValue: '36', paramDesc: '最大租赁期限(月)' },
    { category: 'payment', paramName: 'payment_timeout', paramValue: '30', paramDesc: '支付超时时间(分钟)' },
  ];
  for (const p of extraParams) {
    await prisma.systemParam.create({ data: p });
  }
  console.log(`  ✓ 创建系统参数: ${extraParams.length}条`);

  // ============ 7. 报表模板 ============
  console.log('  创建报表模板...');
  const templates = [
    { name: '日报表', type: 'daily', metrics: '["userAccess","reservationCount","rentalCount"]', format: 'pdf', pushConfig: '{"cron":"0 8 * * *","receivers":["admin"]}', status: 'active' },
    { name: '周报表', type: 'weekly', metrics: '["userAccess","reservationCount","rentalCount","utilizationRate"]', format: 'pdf', pushConfig: '{"cron":"0 9 * * 1","receivers":["admin"]}', status: 'active' },
    { name: '月报表', type: 'monthly', metrics: '["userAccess","reservationCount","rentalCount","utilizationRate","auditCount"]', format: 'excel', pushConfig: '{"cron":"0 10 1 * *","receivers":["admin"]}', status: 'active' },
    { name: '年报', type: 'yearly', metrics: '["userAccess","reservationCount","rentalCount","utilizationRate","auditCount","announcementCount"]', format: 'excel', pushConfig: null, status: 'active' },
  ];
  for (const t of templates) {
    await prisma.reportTemplate.create({ data: t });
  }
  console.log(`  ✓ 创建报表模板: ${templates.length}条`);

  // ============ 8. 报表记录 ============
  console.log('  创建报表记录...');
  const reportRecords: any[] = [];
  for (let i = 0; i < 8; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const types = ['日报表', '周报表', '月报表'];
    reportRecords.push({
      templateId: (i % 4) + 1,
      name: `${types[i % 3]}_${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`,
      period: `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`,
      filePath: `/uploads/reports/report_${i+1}.pdf`,
      format: i % 2 === 0 ? 'pdf' : 'excel',
      createdBy: admin.id,
      createdAt: date,
    });
  }
  await prisma.reportRecord.createMany({ data: reportRecords });
  console.log(`  ✓ 创建报表记录: ${reportRecords.length}条`);

  // ============ 9. 更多人防工程数据 ============
  console.log('  创建更多人防工程...');
  const moreProjects = [
    { name: '南通中央商务区人防工程', code: 'NT-001', longitude: 120.8647, latitude: 32.0162, area: 5200, buildType: '新建', projectType: '人员掩蔽工程', capacity: 1800, peacetimeUse: '地下停车场', manageUnit: '南通市国动办', region: '南通市崇川区' },
    { name: '扬州文昌阁人防工程', code: 'YZ-001', longitude: 119.4210, latitude: 32.3942, area: 3800, buildType: '新建', projectType: '人员掩蔽工程', capacity: 1200, peacetimeUse: '地下商业', manageUnit: '扬州市国动办', region: '扬州市广陵区' },
    { name: '盐城聚龙湖人防工程', code: 'YC-001', longitude: 120.1572, latitude: 33.3799, area: 6200, buildType: '新建', projectType: '医疗救护工程', capacity: 2000, peacetimeUse: '地下车库', manageUnit: '盐城市国动办', region: '盐城市亭湖区' },
    { name: '淮安清江浦人防工程', code: 'HA-001', longitude: 119.0219, latitude: 33.5973, area: 4500, buildType: '改建', projectType: '物资掩蔽工程', capacity: 1500, peacetimeUse: '仓储', manageUnit: '淮安市国动办', region: '淮安市清江浦区' },
  ];
  for (const p of moreProjects) {
    await prisma.civilAirDefenseProject.create({ data: p });
  }
  console.log(`  ✓ 创建更多人防工程: ${moreProjects.length}条`);

  // ============ 10. 更多纳凉点 ============
  console.log('  创建更多纳凉点...');
  const moreCoolingSpots = [
    { name: '南通钟楼广场纳凉点', address: '南通市崇川区人民中路88号', longitude: 120.8647, latitude: 32.0162, openTime: '09:00-18:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅","WiFi"]', capacity: 160, manageUnit: '南通市国动办', contactPhone: '0513-83200101', region: '南通市崇川区', status: 'active' },
    { name: '扬州东关街纳凉点', address: '扬州市广陵区东关街1号', longitude: 119.4210, latitude: 32.3942, openTime: '09:00-20:00', servicePeriod: '6月1日-9月30日', facilities: '["空调","饮水机","座椅"]', capacity: 120, manageUnit: '扬州市国动办', contactPhone: '0514-83200101', region: '扬州市广陵区', status: 'active' },
  ];
  for (const c of moreCoolingSpots) {
    await prisma.coolingSpot.create({ data: c });
  }
  console.log(`  ✓ 创建更多纳凉点: ${moreCoolingSpots.length}条`);

  console.log('\n✅ 演示数据补充完成!');
}

main()
  .catch((e) => {
    console.error('❌ 演示数据补充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
