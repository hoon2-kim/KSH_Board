import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Board {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @JoinTable({
    name: 'board_relatedBoard',
    joinColumn: {
      name: 'boardId',
    },
    inverseJoinColumn: {
      name: 'relatedBoardId',
    },
  })
  @ManyToMany(() => Board, (board) => board.relatedBoard, {
    onDelete: 'CASCADE',
  })
  relatedBoard: Board[];
}
