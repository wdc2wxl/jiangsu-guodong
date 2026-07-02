import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始补充近7天演示数据...');

  const now = new Date();

  const parkingSpaces = await prisma.parkingSpace.findMany();
  if (parkingSpaces.length === 0) {
    console.log('请先运行主种子脚本');
    return;
  }

  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  const editor = await prisma.user.findFirst({ where: { username: 'editor' } });
  const auditor = await prisma.user.findFirst({ where: { username: 'auditor' } });

  const names = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨明', '赵磊', '黄丽', '周强', '吴敏', '徐军', '孙慧', '马超', '朱琳', '胡兵', '郭红', '何勇', '林雪', '高峰', '罗丹', '郑华', '梁宇', '谢军', '韩梅', '唐飞'];
  const plates = ['苏A12345', '苏A67890', '苏B22222', '苏A55555', '苏C33333', '苏A88888', '苏B99999', '苏A45678', '苏D66666', '苏E77777', '苏A33456', '苏B88765', '苏F12390', '苏A99888'];
  const resStatuses = ['reserved', 'used', 'expired', 'cancelled'];

  // ============ 1. 近7天预约数据（每天5-8条）============
  console.log('  创建近7天预约数据...');
  const reservations: any[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const count = 5 + Math.floor(Math.random() * 4); // 5-8条/天
    for (let i = 0; i < count; i++) {
      const parking = parkingSpaces[Math.floor(Math.random() * parkingSpaces.length)];
      const status = resStatuses[Math.floor(Math.random() * resStatuses.length)];
      const reserveDate = new Date(date);
      reserveDate.setHours(8 + Math.floor(Math.random() * 10));
      reservations.push({
        reservationNo: `YY${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(reservations.length + 100).padStart(4,'0')}`,
        parkingId: parking.id,
        projectId: parking.projectId,
        userName: names[Math.floor(Math.random() * names.length)],
        userPhone: `138${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        plateNumber: plates[Math.floor(Math.random() * plates.length)],
        reserveDate,
        startTime: '09:00',
        endTime: '18:00',
        status,
        submitTime: new Date(reserveDate.getTime() - 3600000),
        arriveTime: status === 'used' ? new Date(reserveDate.getTime() + 30*60000) : null,
        leaveTime: status === 'used' ? new Date(reserveDate.getTime() + 8*3600000) : null,
      });
    }
  }
  await prisma.parkingReservation.createMany({ data: reservations });
  console.log(`  ✓ 创建近7天预约: ${reservations.length}条`);

  // ============ 2. 近7天租赁数据（每天2-4条）============
  console.log('  创建近7天租赁数据...');
  const rentalStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'active', 'expired'];
  const rentals: any[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const count = 2 + Math.floor(Math.random() * 3); // 2-4条/天
    for (let i = 0; i < count; i++) {
      const parking = parkingSpaces[Math.floor(Math.random() * parkingSpaces.length)];
      const status = rentalStatuses[Math.floor(Math.random() * rentalStatuses.length)];
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 3));
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 12);
      rentals.push({
        rentalNo: `ZL${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}${String(rentals.length + 100).padStart(4,'0')}`,
        parkingId: parking.id,
        projectId: parking.projectId,
        applicantName: names[Math.floor(Math.random() * names.length)],
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
  }
  await prisma.parkingRental.createMany({ data: rentals });
  console.log(`  ✓ 创建近7天租赁: ${rentals.length}条`);

  // ============ 3. 近7天用户访问日志（更密集）============
  console.log('  创建近7天用户访问日志...');
  const sources = ['wechat', 'alipay', 'web'];
  const regions = ['南京市', '苏州市', '无锡市', '常州市', '徐州市', '南通市', '扬州市', '盐城市'];
  const accessLogs: any[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const count = 80 + Math.floor(Math.random() * 60); // 80-140条/天
    for (let i = 0; i < count; i++) {
      const accessTime = new Date(date);
      accessTime.setHours(6 + Math.floor(Math.random() * 16));
      accessTime.setMinutes(Math.floor(Math.random() * 60));
      accessLogs.push({
        userId: `user_${Math.floor(Math.random() * 5000)}`,
        source: sources[Math.floor(Math.random() * 3)],
        region: regions[Math.floor(Math.random() * regions.length)],
        accessTime,
      });
    }
  }
  await prisma.userAccessLog.createMany({ data: accessLogs });
  console.log(`  ✓ 创建近7天访问日志: ${accessLogs.length}条`);

  // ============ 4. 近7天资源查询日志 ============
  console.log('  创建近7天资源查询日志...');
  const resourceTypes = ['project', 'cooling', 'service', 'parking', 'museum'];
  const keywords = ['纳凉', '停车', '人防工程', '体验馆', '警报', '防空', '预约', '租赁'];
  const queryLogs: any[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const count = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      const queryTime = new Date(date);
      queryTime.setHours(8 + Math.floor(Math.random() * 12));
      queryLogs.push({
        resourceType: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        resourceId: Math.floor(Math.random() * 10) + 1,
        keyword: keywords[Math.floor(Math.random() * keywords.length)],
        queryTime,
      });
    }
  }
  await prisma.resourceQueryLog.createMany({ data: queryLogs });
  console.log(`  ✓ 创建近7天查询日志: ${queryLogs.length}条`);

  // ============ 5. 近7天操作日志 ============
  console.log('  创建近7天操作日志...');
  const logModules = ['数据管理', '数据审核', '预约租赁', '统计分析', '系统管理'];
  const logActions = ['create', 'update', 'delete', 'audit_pass', 'audit_reject', 'login', 'export'];
  const logTargets = ['人防工程', '纳凉点', '便民服务点', '人防车位', '宣教体验馆', '警报音频', '审核流程', '车位预约', '车位租赁', '系统用户', '系统参数', '公告'];
  const users = [admin, editor, auditor].filter(Boolean);
  const logData: any[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const count = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const logTime = new Date(date);
      logTime.setHours(8 + Math.floor(Math.random() * 12));
      logTime.setMinutes(Math.floor(Math.random() * 60));
      const user = users[i % users.length];
      logData.push({
        userId: user.id,
        module: logModules[Math.floor(Math.random() * logModules.length)],
        action: logActions[Math.floor(Math.random() * logActions.length)],
        target: logTargets[Math.floor(Math.random() * logTargets.length)],
        detail: `操作详情记录 #${logData.length + 100}`,
        ip: `10.10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        result: Math.random() > 0.1 ? 'success' : 'fail',
        createdAt: logTime,
      });
    }
  }
  await prisma.operationLog.createMany({ data: logData });
  console.log(`  ✓ 创建近7天操作日志: ${logData.length}条`);

  console.log('\n✅ 近7天演示数据补充完成!');
}

main()
  .catch((e) => {
    console.error('❌ 数据补充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
