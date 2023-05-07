import { Board } from './entities/board.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBoardDto } from './dto/create-board.dto';

import { Not, Repository } from 'typeorm';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async findAllLists() {
    return this.boardRepository.find({
      select: ['id', 'title', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number) {
    return await this.boardRepository.findOne({
      where: { id },
      relations: ['relatedBoard'],
      // order: { createdAt: 'DESC' },
    });
  }

  async create(createBoardDto: CreateBoardDto) {
    const { title, content } = createBoardDto;

    const result = this.boardRepository.create({
      title,
      content,
    });

    await this.boardRepository.save(result);
    // 내가 방금 만든 게시물 단어 별로 추출
    const currentPostWords = this.filteredContents(content);

    // 만든 게시물을 제외한 나머지 게시글들
    const otherPostsWordMap = new Map<string, number>();

    const otherPosts = await this.boardRepository.find({
      where: { id: Not(result.id) },
    });

    otherPosts.forEach((post) => {
      const postWords = this.filteredContents(post.content);
      postWords.forEach((word) => {
        const count = otherPostsWordMap.get(word) || 0;
        otherPostsWordMap.set(word, count + 1);
      });
    });

    const totalWordsCount = Array.from(otherPostsWordMap.values()).reduce(
      (total, count) => total + count,
      0,
    );

    // 60프로 이상 단어 제외
    const filteredWords = [...otherPostsWordMap]
      .filter(([, count]) => count / totalWordsCount <= 0.6)
      .map(([word, _]) => word);

    const relatedWordsMap = new Map();

    filteredWords.forEach((word) => {
      if (currentPostWords.includes(word)) {
        let count = 0;
        otherPosts.forEach((post) => {
          if (this.filteredContents(post.content).includes(word)) {
            count++;
          }
        });
        relatedWordsMap.set(word, count);
      }
    });

    const relatedPosts = [];

    otherPosts.forEach(async (post) => {
      let count = 0;
      const postWords = this.filteredContents(post.content);
      currentPostWords.forEach((word) => {
        if (postWords.includes(word) && relatedWordsMap.has(word)) {
          count += relatedWordsMap.get(word) || 0;
        }
      });

      if (count > 0) {
        const relatedWordCount = currentPostWords.filter(
          (word) => postWords.includes(word) && relatedWordsMap.has(word),
        ).length;
        if (relatedWordCount >= 2 && count / totalWordsCount <= 0.4) {
          relatedPosts.push(post.id);
        }
      }
    });

    relatedPosts.forEach(async (postId) => {
      const qb = this.boardRepository.createQueryBuilder('board');
      await qb.relation(Board, 'relatedBoard').of(result).add(postId);
    });

    return result;
  }

  private filteredContents(content: string) {
    const reg = content
      .replace(/[^\w\s\u3131-\uD79D]+/g, '')
      .toLowerCase()
      .split(/\s+/);

    return reg;
  }
}
