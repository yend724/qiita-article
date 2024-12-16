import { execSync } from 'child_process';

const generateRandom = (length: number = 16): string => {
  const s = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length })
    .map(() => s[Math.floor(Math.random() * s.length)])
    .join('');
};

const today = new Date();
const generateDate = (dateTime: Date): string => {
  const year = dateTime.getFullYear().toString();
  const month = ('0' + (dateTime.getMonth() + 1)).slice(-2);
  const date = ('0' + dateTime.getDate()).slice(-2);
  return `${year}${month}${date}`;
};

execSync(`npx qiita new ${generateDate(today)}-${generateRandom()}`);
