import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  findPostLists() {
    return this.boardsService.findAllLists();
  }

  @Get('/:id')
  findPostById(@Param('id') id: number) {
    return this.boardsService.findById(id);
  }

  @Post()
  createPosts(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }
}
